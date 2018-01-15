import { exec } from 'shelljs'

import startRouter from '.'

exec('kill -9 $(lsof -i:7001 -t) 2> /dev/null', (code, stdout, stderr) => {
  if (stderr) {
    // tslint:disable-next-line no-console
    console.error(stderr)
    return
  }

  startRouter()
})
