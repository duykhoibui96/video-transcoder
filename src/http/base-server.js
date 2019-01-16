import Koa from 'koa'
import http from 'http'
import Router from 'koa-66'
import cors from 'koa-cors'
import morgan from 'koa-morgan'
import bodyParser from 'koa-bodyparser'
import moment from 'moment'
import path from 'path'
import merge from 'lodash/merge'
import BPromise from 'bluebird'
import {debug} from '@kobiton/core-util'
import {PORT, LOGSTASH_SERVER, ENVIRONMENT} from '../config'
import {NAMESPACE} from '../enums'

const DEFAULT_CONFIG = {
  prefix: '',
  debugPattern: '*',
  debugNamespace: NAMESPACE,
  port: PORT,
  logger: 'combined',
  cors: {
    origin: true,
    credentials: true,
    maxAge: moment.duration(1, 'months').asMilliseconds(),
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  },
  static: path.join(__dirname, './static'),
  logstash: LOGSTASH_SERVER,
  environment: ENVIRONMENT
}

export default class BaseServer {
  constructor(config) {
    this._app = new Koa()
    this._app.config = merge(DEFAULT_CONFIG, config)
    this._configure(this._app)
    this._httpServer = http.createServer(this._app.callback())
  }

  listen() {
    const {port} = this._app.config
    return BPromise.fromCallback((done) => this._httpServer.listen(port, done))
  }

  //===============================================
  // Private methods
  //===============================================

  _initRoutes(config) {
    const router = new Router()
    const controllers = config.creators.map((Controller) => new Controller())

    for (const controller of controllers) {
      router.mount(config.prefix || '', controller.router)
    }

    return router.routes()
  }

  _configure(app) {
    const {
      logger,
      cors: corsConfig,
    } = app.config;

    app.use(morgan(logger))
    app.use(cors(corsConfig))
    app.use(bodyParser())


    const routes = this._initRoutes(app.config.controller)
    app.use(routes)

    debug.enable('*', {
      logstash: LOGSTASH_SERVER,
      environment: ENVIRONMENT,
      component: 'video-transcoder'
    })
  }
}
