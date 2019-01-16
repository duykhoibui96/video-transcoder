import {debug} from '@kobiton/core-util'
import BaseServer from './http/base-server'
import ExecutionController from './http/controllers/execution'
import WebhookController from './http/controllers/webhook'
import {PORT} from './config'
import {NAMESPACE} from './enums'

export function startServer() {
  const server = new BaseServer({
    controller: {
      creators: [ExecutionController, WebhookController]
    },
    port: PORT
  })
  return server.listen()
    // eslint-disable-next-line max-len
    .then(() => debug.log(NAMESPACE, `Video Transcoder Server is listening on ${PORT}`))
}

startServer()
