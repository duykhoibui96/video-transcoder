import api from '../http/api'
import {API_URL} from '../config'

export function saveVideoUrl({sessionId, userToken, videoPath, size}) {
  return api.put({
    url: `${API_URL}/sessions/${sessionId}/addVideo`,
    body: {
      executionData: {videoPath, size}
    },
    token: userToken
  })
}