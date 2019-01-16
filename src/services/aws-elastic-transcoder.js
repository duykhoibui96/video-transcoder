import AWS from 'aws-sdk'
import BPromise from 'bluebird'
import {debug} from '@kobiton/core-util'
import {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  AWS_ELASTIC_API_VERSION,
  AWS_ELASTIC_TRANSCODER_PIPELINE_ID
} from '../config'
import {saveVideoUrl} from './session'
import {AWS_ELASTIC_TRANSCODER_STATUS, NAMESPACE} from '../enums'

const awsElasticTranscoder = new AWS.ElasticTranscoder({
  apiVersion: AWS_ELASTIC_API_VERSION,
  region: AWS_REGION,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY
});

const presetMap = [
  {
    id: '1234',
    resolution: 1024
  }
]

export function createJob({sessionId, userToken, videos = [], resolution, udid}) {
  if (!videos.length) {
    throw new Error('No input videos found.')
  }

  const outputKey = `sessions/${sessionId}/videos/Video_${udid}.mp4`
  const params = {
    PipelineId: AWS_ELASTIC_TRANSCODER_PIPELINE_ID,
    Inputs: [],
    Outputs: [{
      Key: outputKey,
      PresetId: _getPresetId(resolution),
      Rotate: 'auto'
    }],
    UserMetadata: {
      sessionId,
      userToken
    }
  }

  const sortedVideos = _sortVideos(videos)

  sortedVideos.forEach((key) => {
    const input = {
      Key: key,
      FrameRate: 'auto',
      Resolution: 'auto',
      AspectRatio: 'auto',
      Interlaced: 'auto',
      Container: 'auto'
    }

    params.Inputs.push(input)
  })

  return new BPromise((resolve, reject) => {
    awsElasticTranscoder.createJob(params, (err, data) => {
      if (err) {
        debug.error(NAMESPACE, `Could not process videos of session ${sessionId}`, err)
        return reject(new Error(err))
      }

      debug.log(NAMESPACE, `Start processing videos of session ${sessionId}`)
      return resolve(data)
    })
  })
}

export async function handleWebhookMsg(ctx) {
  const {state, ...msg} = ctx.request.body

  switch(state) {
    case AWS_ELASTIC_TRANSCODER_STATUS.COMPLETED:
      _handleCompletedJob(msg)
      break
    case AWS_ELASTIC_TRANSCODER_STATUS.PROCESSING:
      _handleProcessingMsg(msg)
      break
    case AWS_ELASTIC_TRANSCODER_STATUS.WARNING:
      _handleWarningMsg(msg)
      break
    case AWS_ELASTIC_TRANSCODER_STATUS.ERROR:
      _handleErrorMsg(msg)
      break
  }
}

function _sortVideos(videos) {
  return videos.sort((cur, next) => {
    const currentVideoPrefixParts = cur.split('_')[0].split('/')
    const currentIndex = Number(currentVideoPrefixParts[currentVideoPrefixParts.length - 1], 10)
    const nextVideoPrefixParts = next.split('_')[0].split('/')
    const nextIndex = Number(nextVideoPrefixParts[nextVideoPrefixParts.length - 1], 10)
    return currentIndex - nextIndex
  })
}

function _getPresetId(resolution) {
  const preset = presetMap.find((p) => p.resolution === resolution)

  if (preset) {
    return preset.id
  }

  // Default presetId if we can't find any presetId matching the resolution
  return presetMap[0].id
}

async function _handleCompletedJob(msg) {
  const {jobId, outputs, userMetadata} = msg
  const {key: videoPath, size} = outputs[0] || {}
  const {sessionId, userToken} = userMetadata || {}

  debug.log(NAMESPACE, `Finish job ${jobId} on transcoding videos of session ${sessionId}`)
  try {
    await saveVideoUrl({sessionId, userToken, videoPath, size})
    debug.log(NAMESPACE, `Saved full video of session ${sessionId}`)
  } catch (error) {
    debug.error(NAMESPACE, `Could not save video of session ${sessionId}`, error)
  }
}

function _handleProcessingMsg(msg) {
  const {jobId, userMetadata} = msg
  const {sessionId} = userMetadata || {}

  debug.log(NAMESPACE, `In transcoding videos of session ${sessionId} on job ${jobId}`)
}

function _handleWarningMsg(msg) {
  const {jobId, messageDetails, userMetadata} = msg
  const {sessionId} = userMetadata || {}

  debug.log(NAMESPACE, 
    `Receive warning message on job ${jobId} processing videos of session ${sessionId}`, messageDetails)
}

function _handleErrorMsg(msg) {
  const {jobId, errorCode, messageDetails, userMetadata} = msg
  const {sessionId} = userMetadata || {}

  debug.error(NAMESPACE, 
    `Receive error message (code: ${errorCode}) on job ${jobId} processing videos of session ${sessionId}`,
    messageDetails)
}
