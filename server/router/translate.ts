import axios from 'axios'
import crypto from 'crypto'
import googleTranslateAPI from 'google-translate-api'
import { Middleware } from 'koa'
import qs from 'qs'

import { Locale } from 'types'
import { LOCALE_COOKIE, TOGGLE_LOCALE } from 'utils'

const SIGNATURE_PREFIX = 'GETtmt.api.qcloud.com/v2/index.php?'

interface TranslateParams {
  source: Locale
  sourceText: string
}

const getTranslatePrams = (params: TranslateParams) => ({
  Action: 'TextTranslate',
  Region: 'ap-shanghai',
  SecretId: process.env.TENCENT_TRANSLATE_API_SECRET_ID,
  SignatureMethod: 'HmacSHA256',
  Timestamp: Math.ceil(Date.now() / 1000),
  Nonce: Math.ceil(Math.random() * Number.MAX_SAFE_INTEGER),
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
  const {
    query: { source, sourceText },
  } = ctx

  if (!sourceText) {
    return
  }

  if (process.env.GOOGLE_TRANSLATE_ENABLED) {
    const translated = await googleTranslateAPI(sourceText, {
      from: GoogleTranslateLocales[source],
      to: TOGGLE_LOCALE[source as Locale],
    })
    ctx.body = Object.assign(translated, {
      text: translated.text
        .replace(/<code>([^<>]+)<\/\w+> Code>/g, '<code>$1</code>')
        .replace(/<\/g> -([^<>]+)>/g, '</g-$1>')
        .replace(/<\/ ([^<>]+)>/g, '</$1>'),
    })
    return
  }

  const translateParams = getTranslatePrams({
    source: source || (ctx.cookies.get(LOCALE_COOKIE) as Locale),
    sourceText,
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

  const { data } = await axios.get('https://tmt.api.qcloud.com/v2/index.php', {
    params: Object.assign(translateParams, { Signature }),
  })

  const targetText = data.targetText as string

  ctx.body = {
    ...data,
    targetText:
      targetText &&
      targetText.replace(/\<([^<>]+)\>/g, (_matched, $1: string) => {
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
