export const PORT = Number(process.env.KOBITON_VIDEO_TRANSCODER_PORT) || 3001

export const LOGSTASH_SERVER = process.env.KOBITON_LOGSTASH_SERVER || ''
export const ENVIRONMENT = process.env.KOBITON_ENVIRONMENT || 'dev'

export const API_URL = process.env.KOBITON_API_URL || 'localhost:3000'

export const AWS_ACCESS_KEY_ID = process.env.KOBITON_AWS_ACCESS_KEY_ID || ''
export const AWS_SECRET_ACCESS_KEY = process.env.KOBITON_AWS_SECRET_ACCESS_KEY || ''
export const AWS_S3_BUCKET = process.env.KOBITON_AWS_S3_BUCKET || ''
export const AWS_REGION = process.env.KOBITON_AWS_REGION || ''
export const AWS_ELASTIC_API_VERSION =
  process.env.KOBITON_AWS_ELASTIC_API_VERSION || '2012-09-25'
export const AWS_ELASTIC_TRANSCODER_PIPELINE_ID =
  process.env.KOBITON_AWS_ELASTIC_TRANSCODER_PIPELINE_ID || ''