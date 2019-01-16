import fetch from 'node-fetch'
import isEmpty from 'lodash/isEmpty'
import isObject from 'lodash/isObject'
import noop from 'lodash/noop'

class Api {

  constructor() {
    this._defaultBaseUrl = ''
    this._defaultOptions = {}
    this._onErrorResponse = noop
  }

  /**
   * Makes an HTTP request
   * @param {Object} params: {
   *                   baseUrl {String} (Optional) Specify baseURL for current request.
   *                   url {String} relative url.
   *                   method {String} HTTP method.
   *                   body {Object} Payload for POST/PUT/DELETE request.
   *                   token {String} Auth token.
   *                 }
   * @return {Promise}
   */
  send({baseUrl, url, method = 'GET', headers = {}, token, body}) {
    const _baseUrl = baseUrl || this._defaultBaseUrl
    const defaultOptions = this._defaultOptions
    const absUrl = _baseUrl.replace(/\/$/, '') + '/' + url.replace(/^\//, '')
    const opts = {
      ...defaultOptions,
      method,
      headers: {
        Accept: 'application/json',
        ...headers
      }
    }

    if (token) {
      opts.headers.Authorization = `Bearer ${token}`
    }

    if (body && method !== 'GET') {
      const isObject = Object.prototype.toString.call(body) === '[object Object]'
      if (isObject) {
        opts.body = JSON.stringify(body)
        if (opts.headers['Content-Type'] == null) {
          opts.headers['Content-Type'] = 'application/json'
        }
      }
      else {
        opts.body = body
      }
    }

    return fetch(absUrl, opts) // eslint-disable-line no-undef
      .then(throwIfError(this))
      .then(parseResponse)
  }

  registerErrorResponse(cb) {
    this._onErrorResponse = cb
  }

  /**
   * Sets the base URL for subsequent API requests.
   * @param {String} url the base URL.
   */
  setDefaultBaseUrl(url) {
    url = url || ''
    this._defaultBaseUrl = url + (url.endsWith('/') ? '' : '/')
  }

  /**
   * Sets options for subsequent API requests.
   * @params {Object} options for API requests.
   */
  setOptions(options) {
    options = options || {}
    this._defaultOptions = {...this._defaultOptions, ...options}
  }

  /**
   * Performs a GET request.
   */
  get(params) {
    const {qs, url: originalUrl = ''} = params
    const isQueryExisted = (originalUrl.indexOf('?') >= 0)
    const isValidQS = (isObject(qs) && !isEmpty(qs))
    const url = `${originalUrl}${(isValidQS
      ? `${isQueryExisted ? '&' : '?'}${encodeQuery(qs)}` : '')}`

    return this.send({...params, url, method: 'GET'})
  }

  /**
   * Performs a POST request.
   */
  post(params) {
    return this.send({...params, method: 'POST'})
  }

  /**
   * Performs a PUT request.
   */
  put(params) {
    return this.send({...params, method: 'PUT'})
  }

  /**
   * Performs a DELETE request.
   */
  delete(params) {
    return this.send({...params, method: 'DELETE'})
  }
}

function throwIfError(context) {
  return function (response) {
    if (response.status >= 200 && response.status < 300) {
      return response
    }

    context._onErrorResponse(response)

    const method = getBodyFn(response)

    return response[method]().then((err) => {
      const error = new Error(err.message || err)
      error.status = response.status
      throw error
    })
  }
}

function parseResponse(response) {
  const method = getBodyFn(response)
  return response[method]()
}

function getBodyFn(response) {
  const contentType = response.headers.get('Content-Type')
  return contentType && contentType.includes('json') ? 'json' : 'text'
}

function encodeQuery(qs) {
  if (!qs) return ''

  return Object.keys(qs)
    .filter((k) => qs[k])
    .map((k) => (`${k}=${encodeURIComponent(qs[k])}`))
    .join('&')
}

export default new Api()
