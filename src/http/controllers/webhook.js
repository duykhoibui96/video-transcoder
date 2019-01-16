import {controller, post} from 'route-decorators'
import HttpStatusCodes from 'http-status-codes'
import BaseController from '../base-controller'
import {handleWebhookMsg} from '../../services/aws-elastic-transcoder'

@controller('/webhook')
export default class WebhookController extends BaseController {

  @post('/')
  async notifyVideoTranscodingStatus(ctx) {
    await handleWebhookMsg(ctx)

    ctx.status = HttpStatusCodes.OK
  }
  
}
