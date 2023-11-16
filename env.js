const fs = require('node:fs')

const { parse } = require('dotenv')

const LOCAL_ENV = '.env.local'

let localEnv = {}

if (fs.existsSync(LOCAL_ENV)) {
  localEnv = parse(fs.readFileSync(LOCAL_ENV))
}

module.exports = {
  DEBUG: '1stg:*',
  PARSER_NO_WATCH: true,
  TS_NODE_FILES: true,
  GITHUB_REPOSITORY_NAME: 'blog',
  GITHUB_REPOSITORY_OWNER: 'JounQin',
  GITHUB_REPOSITORY_OWNER_TYPE: 'user',
  GITHUB_EXCLUDED_LABELS: [
    'dependencies',
    'feature',
    'flag',
    'greenkeeper',
    'PR: draft',
    'PR: merged',
    'PR: partially-approved',
    'PR: reviewed-approved',
    'PR: reviewed-changes-requested',
    'PR: unreviewed',
    'security',
  ].join(','),
  ...localEnv,
  NODE_ENV: process.env.NODE_ENV || localEnv.NODE_ENV,
}
