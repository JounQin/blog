import crypto from 'crypto'

import axios from 'axios'
import _debug from 'debug'
import googleTranslateAPI from 'google-translate-api'
import { Middleware } from 'koa'
import qs from 'qs'

import { Locale } from 'types'
import { LOCALE_COOKIE, TOGGLE_LOCALE } from 'utils'

const debug = _debug('1stg:translate')

interface TranslateParams {
  source: Locale
  text: string
}

const getTranslatePrams = (params: TranslateParams) => ({
  app_id: process.env.TENCENT_AI_API_APP_ID,
  time_stamp: Math.ceil(Date.now() / 1000),
  nonce_str: Math.ceil(Math.random() * Number.MAX_SAFE_INTEGER),
  ...params,
  target: TOGGLE_LOCALE[params.source],
})

const alphabeticalSort = (a: string, b: string) => (a > b ? 1 : a < b ? -1 : 0)

const GoogleTranslateLocales: {
  [key: string]: string
} = {
  zh: 'zh-cn',
  en: 'en',
}

const translate: Middleware = async ctx => {
  const { Source, SourceText } = ctx.query as Record<string, string>

  if (!SourceText) {
    return
  }

  if (process.env.GOOGLE_TRANSLATE_ENABLED) {
    try {
      const translated = await googleTranslateAPI(SourceText, {
        from: GoogleTranslateLocales[Source],
        to: TOGGLE_LOCALE[Source as Locale],
      })

      ctx.body = {
        text: translated.text
          .replaceAll(/<code>([^<>]+)<\/\w+> Code>/g, '<code>$1</code>')
          .replaceAll(/<\/g> -([^<>]+)>/g, '</g-$1>')
          .replaceAll(/<\/ ([^<>]+)>/g, '</$1>'),
      }
      return
    } catch (e) {
      if (process.env.TRY_TENCENT_ON_GOOGLE_FAILED) {
        debug('Google translate failed, try Tencent translate service')
      } else {
        return ctx.throw(e)
      }
    }
  }

  const translateParams = getTranslatePrams({
    source: (Source || ctx.cookies.get(LOCALE_COOKIE)) as Locale,
    text: SourceText,
  })

  const {
    data: {
      data: { target_text },
      msg,
      ret,
    },
  } = await axios.get<{
    data?: {
      target_text: string
    }
    msg?: string
    ret: number
  }>('https://api.ai.qq.com/fcgi-bin/nlp/nlp_texttranslate', {
    params: Object.assign(translateParams, {
      sign: crypto
        .createHash('md5')
        .update(
          qs.stringify(translateParams, {
            sort: alphabeticalSort,
          }) +
            '&app_key=' +
            process.env.TENCENT_AI_API_APP_KEY,
          'utf8',
        )
        .digest('hex')
        .toUpperCase(),
    }),
  })

  if (ret !== 0) {
    return ctx.throw(msg)
  }

  ctx.body = {
    text: target_text.replaceAll(/<([^<>]+)>/g, (_matched, $1: string) => {
      $1 = $1.toLowerCase().trim()
      $1 = $1.startsWith('/')
        ? $1.replaceAll(' ', '')
        : $1
            // eslint-disable-next-line regexp/optimal-quantifier-concatenation
            .replaceAll(/([_a-z-]+)= ?" ?([^"<>]+) ?"?/g, '$1="$2"')
            .replaceAll(/"+/g, '"')
      return '<' + $1 + '>'
    }),
  }
}

export default translate
