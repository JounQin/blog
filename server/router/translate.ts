import axios from 'axios'
import crypto from 'crypto'
import _debug from 'debug'
import googleTranslateAPI from 'google-translate-api'
import { Middleware } from 'koa'
import qs from 'qs'

import { Locale } from 'types'
import { LOCALE_COOKIE, TOGGLE_LOCALE } from 'utils'

const debug = _debug('1stg:transalte')

const SIGNATURE_PREFIX = 'GETtmt.tencentcloudapi.com/?'

interface TranslateParams {
  Source: Locale
  SourceText: string
}

const getTranslatePrams = (params: TranslateParams) => ({
  Action: 'TextTranslate',
  Region: 'ap-shanghai',
  SecretId: process.env.TENCENT_TRANSLATE_API_SECRET_ID,
  SignatureMethod: 'HmacSHA256',
  Timestamp: Math.ceil(Date.now() / 1000),
  Nonce: Math.ceil(Math.random() * Number.MAX_SAFE_INTEGER),
  Version: '2018-03-21',
  ProjectId: 0,
  ...params,
  Target: TOGGLE_LOCALE[params.Source],
})

const alphabeticalSort = (a: string, b: string) => (a > b ? 1 : a < b ? -1 : 0)

const GoogleTranslateLocales: {
  [key: string]: string
} = {
  zh: 'zh-cn',
  en: 'en',
}

const translate: Middleware = async ctx => {
  const {
    query: { Source, SourceText },
  } = ctx

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
          .replace(/<code>([^<>]+)<\/\w+> Code>/g, '<code>$1</code>')
          .replace(/<\/g> -([^<>]+)>/g, '</g-$1>')
          .replace(/<\/ ([^<>]+)>/g, '</$1>'),
      }
      return
    } catch (e) {
      if (process.env.TRY_TENCENT_ON_GOOGLE_FAILED) {
        debug('Google translate failed, try Tencent translate service')
      } else {
        ctx.throw(e)
      }
    }
  }

  const translateParams = getTranslatePrams({
    Source: Source || (ctx.cookies.get(LOCALE_COOKIE) as Locale),
    SourceText,
  })

  const Signature = crypto
    .createHmac('sha256', process.env.TENCENT_TRANSLATE_API_SECRET_KEY)
    .update(
      SIGNATURE_PREFIX +
        qs.stringify(translateParams, {
          encode: false,
          sort: alphabeticalSort,
        }),
    )
    .digest('base64')

  const {
    data: {
      Response: { TargetText },
    },
  } = await axios.get<{
    Response: {
      TargetText: string
    }
  }>('https://tmt.tencentcloudapi.com', {
    params: Object.assign(translateParams, { Signature }),
  })

  ctx.body = {
    text: TargetText.replace(/\<([^<>]+)\>/g, (_matched, $1: string) => {
      $1 = $1
        .toLowerCase()
        .replace(/ /g, '')
        .replace(/\/+/g, '/')
      const index = $1.indexOf('/')
      if (index !== -1) {
        $1 = $1.substr(index)
      }
      return '<' + $1 + '>'
    }),
  }
}

export default translate
