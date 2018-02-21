import { InMemoryCache } from 'apollo-cache-inmemory'
import ApolloClient from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import axios from 'axios'
import _debug from 'debug'
import gql from 'graphql-tag'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import compose from 'koa-compose'
import Router from 'koa-router'
import session from 'koa-session'
import fetch from 'node-fetch'
import uuid from 'uuid'

import { serverHost, serverPort } from '../../build/config'

import { User } from 'types'

import translate from './translate'

global.fetch = fetch as any

const { APP_KEYS, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env

const debug = _debug('1stg:server:router')

const router = new Router({
  prefix: '/api',
})

router
  .get('/user', (ctx, next) => {
    const { user } = ctx.session
    let sessionID

    if (!user) {
      sessionID = uuid()
      ctx.session.uuid = sessionID
    }

    ctx.body = user || {
      uuid: sessionID,
    }
  })
  .get('/oauth', async (ctx, next) => {
    const { code, path, state } = ctx.query

    if (!state || state !== ctx.session.uuid) {
      return ctx.throw('invalid oauth redirect')
    }

    const { data } = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
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

    ctx.redirect(`${path.replace(/ /g, '%2B')}`)
  })
  .get('/translate', translate)

export default (app?: Koa) => {
  const provided = !!app

  const middlewares = [bodyParser(), router.routes(), router.allowedMethods()]

  if (!app) {
    app = new Koa()
    app.keys = app.keys = APP_KEYS.split(',')
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
