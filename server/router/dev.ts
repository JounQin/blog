import { exec } from 'shelljs'

import { serverPort } from '../../build/config'

import startRouter from '.'

exec(
  `kill -9 $(lsof -i:${serverPort + 1} -t) 2> /dev/null`,
  (_code, _stdout, stderr) => {
    if (stderr) {
      // tslint:disable-next-line no-console
      console.error(stderr)
      return
    }

    startRouter()
  },
)
