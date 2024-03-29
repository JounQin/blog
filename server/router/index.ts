import { InMemoryCache } from 'apollo-cache-inmemory'
import ApolloClient from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import axios from 'axios'
import _debug from 'debug'
import gql from 'graphql-tag'
import Koa, { DefaultState, DefaultContext, Middleware } from 'koa'
import bodyParser from 'koa-bodyparser'
import compose from 'koa-compose'
import Router from 'koa-router'
import session from 'koa-session'
import fetch from 'node-fetch'
import { v4 as uuid } from 'uuid'

import { serverHost, serverPort } from '../../build/config'

import translate from './translate'

import { User } from 'types'

// @ts-expect-error
global.fetch = fetch

const debug = _debug('1stg:server:router')

const router = new Router<DefaultState, DefaultContext>({
  prefix: '/api',
})

const STR_ENV_KEYS = [
  'GITHUB_REPOSITORY_OWNER',
  'GITHUB_REPOSITORY_OWNER_TYPE',
  'GITHUB_REPOSITORY_NAME',
  'GITHUB_CLIENT_ID',
  'GITHUB_OAUTH_CALLBACK',
]

const STR_ARR_ENV_KEYS = [
  'GITHUB_EXCLUDED_LABELS',
  'GITHUB_EXCLUDED_REPOSITORY_OWNERS',
]

const ENV_KEYS = [...STR_ENV_KEYS, ...STR_ARR_ENV_KEYS]

router
  .get('/fetchInfo', ctx => {
    const user = ctx.session.user as {
      uuid: string
    }
    let sessionID: string

    if (!user) {
      sessionID = uuid()
      ctx.session.uuid = sessionID
    }

    ctx.body = {
      user: user || {
        uuid: sessionID,
      },
      envs: ENV_KEYS.reduce((envs, key) => {
        let value: string[] | string = process.env[key]

        if (STR_ARR_ENV_KEYS.includes(key)) {
          value = value ? value.split(',') : []
        }

        return Object.assign(envs, {
          [key]: value,
        })
      }, {}),
    }
  })
  .get('/oauth', async ctx => {
    const { code, path, state } = ctx.query as Record<string, string>

    if (!state || state !== ctx.session.uuid) {
      return ctx.throw('invalid oauth redirect')
    }

    const { data } = await axios.post<{
      access_token?: string
      error?: unknown
    }>(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        state,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      },
    )

    if (data.error) {
      return ctx.throw(data)
    }

    const token = data.access_token

    ctx.session.token = token

    const apollo = new ApolloClient({
      link: createHttpLink({
        uri: 'https://api.github.com/graphql',
        headers: {
          Authorization: `bearer ${token}`,
        },
      }),
      cache: new InMemoryCache(),
    })

    const { data: user } = await apollo.query<{ viewer: User }>({
      query: gql`
        query {
          viewer {
            avatarUrl
            id
            login
            name
            url
            websiteUrl
          }
        }
      `,
    })

    ctx.session.user = user.viewer

    ctx.redirect(`${path.replaceAll(' ', '%2B')}`)
  })
  .get('/translate', translate)

export default (app?: Koa) => {
  const provided = !!app

  const middlewares = [
    bodyParser(),
    router.routes(),
    router.allowedMethods(),
  ] as Middleware[]

  if (!app) {
    app = new Koa()
    app.keys = app.keys = (process.env.APP_KEYS || '').split(',')
    middlewares.unshift(session({}, app))
  }

  if (provided) {
    return middlewares
  }

  app.use(compose(middlewares))

  app.listen(serverPort + 1, serverHost, () => {
    debug('Router server is now running at %s:%s', serverHost, serverPort + 1)
  })
}
