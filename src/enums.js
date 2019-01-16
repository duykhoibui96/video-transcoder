import keyMirror from 'keymirror'

export const NAMESPACE = 'video-transcoder'

export const AWS_ELASTIC_TRANSCODER_STATUS = keyMirror({
  PROCESSING: null,
  COMPLETED: null,
  WARNING: null,
  ERROR: null
})