import {controller, post} from 'route-decorators'
import HttpStatusCodes from 'http-status-codes'
import BaseController from '../base-controller'
import {createJob} from '../../services/aws-elastic-transcoder'

@controller('/execution')
export default class ExecutionController extends BaseController {

  @post('/')
  async transcodeVideo(ctx) {
    const {sessionId, userToken, videoFiles} = ctx.request.body

    try {
      const msg = await createJob({sessionId, userToken, videoFiles})
    
      ctx.body = msg
    } catch (err) {
      ctx.throw(err.message, HttpStatusCodes.BAD_REQUEST)
    }

  }

}
