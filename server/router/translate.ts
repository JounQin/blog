import axios from 'axios'
import * as crypto from 'crypto'
import { Middleware } from 'koa'
import * as qs from 'qs'

import { LOCALE_COOKIE, Locale, TOGGLE_LOCALE } from 'utils'

const {
  TENCENT_TRANSLATE_API_SECRET_ID: SecretId,
  TENCENT_TRANSLATE_API_SECRET_KEY: SecretKey,
} = process.env

const SIGNATURE_PREFIX = 'GETtmt.api.qcloud.com/v2/index.php?'

const COMMON_PARAMS = {
  Action: 'TextTranslate',
  Region: 'ap-shanghai',
  SecretId,
  SignatureMethod: 'HmacSHA256',
}

interface TranslateParams {
  source: Locale
  sourceText: string
}

const getTranslatePrams = (params: TranslateParams) => ({
  ...COMMON_PARAMS,
  Timestamp: Math.ceil(Date.now() / 1000),
  Nonce: Math.ceil(Math.random() * Number.MAX_SAFE_INTEGER),
  ...params,
  target: TOGGLE_LOCALE[params.source],
})

const alphabeticalSort = (a: string, b: string) => (a > b ? 1 : a < b ? -1 : 0)

const translate: Middleware = async (ctx, next) => {
  const { query: { source, sourceText } } = ctx

  if (!sourceText) {
    return
  }

  const translateParams = getTranslatePrams({
    source: source || (ctx.cookies.get(LOCALE_COOKIE) as Locale),
    sourceText,
  })

  const Signature = crypto
    .createHmac('sha256', SecretKey)
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
      targetText.replace(/\<([^<>]+)\>/g, (matched, $0: string) => {
        $0 = $0
          .toLowerCase()
          .replace(/ /g, '')
          .replace(/\/+/g, '/')
        const index = $0.indexOf('/')
        if (index !== -1) {
          $0 = $0.substr(index)
        }
        return '<' + $0 + '>'
      }),
  }
}

export default translate
