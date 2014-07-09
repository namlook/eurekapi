
express = require 'express'
genericRoutes = require './engine'
_ = require('underscore')

cors = require('cors')

###
Exemple:

var Eurekapi = require('eurekapi');

var server = new Eurekapi({
    name: 'projectName',
    version: 1,
    port: 4000,
    enableCORS: false,
    database: {
        adapter: 'rdf',
        config: {
            store: 'virtuoso',
            graphURI: 'http://projectName.com'
        }
    },
    schemas: require('./schemas'),
    customRoutes: [
        {method: 'delete', url: '/nugget', func: deleteNugget}
    ]
});
server.start();
###

class Server

    constructor: (@config) ->

        if not config.name
            throw 'EurekaServer: name is required'
        @apiVersion = config.version or 1
        @baseURI = @config.baseURI or "/api/#{config.version}"
        @applicationName = @config.name
        @db = @getDatabase()

        @app = express()

        # enable CORS if needed
        if config.enableCORS
            console.log("CORS is enabled");
            @app.use(cors());

        # @app.use("/app/", express.static("#{__dirname}/../../public"))
        path = require("path");
        @app.use("/app", express.static("#{path.resolve('.')}/public"))

        @app.use(express.urlencoded())
        @app.use(express.json())
        @app.use (req, res, next) =>
            req.db = @db
            req.applicationName = @applicationName
            req.config = @config
            next()

        routesAdded = []
        routes = []

        # add the custom routes
        if config.customRoutes
            customRoutes = _.sortBy(config.customRoutes, 'url').reverse()
            for route in customRoutes
                routes.push(route)
                routesAdded.push(route.url)


        # add the generic routes only if the url hasn't already been added
        # useful to overwrite generic routes
        for route in genericRoutes
            if routesAdded.indexOf(route.url) is -1
                routes.push(route)


        # actually attach the routes to the app
        routes = _.sortBy(routes, 'url').reverse()
        for route in routes
            @app[route.method]("#{@baseURI}#{route.url}", route.func)


    getDatabase: () ->
        unless @config.database?
            throw 'EurekaServer: database is required'
        if @config.database.dbtype?
            return @config.database

        unless @config.database.adapter?
            throw 'EurekaServer: database adapter is required'

        Model = require "archimedes/lib/#{@config.database.adapter}/model"

        models = {}
        for modelName, modelInfos of @config.schemas
            if (modelName is 'Basic')
                throw "EurekaServer: 'Basic' is a reserved word and can not be used as model name"
            models[modelName] = Model.extend(modelInfos)

        Database = require "archimedes/lib/#{@config.database.adapter}/database"
        db = new Database @config.database.config
        db.registerModels models
        return db


    start: (port, callback) ->
        if not callback and typeof(port) is 'function'
            callback = port
            port = @config.port
        unless port
            port = @config.port
        console.log "starting http://localhost:#{port}..."
        console.log "api accessible at http://localhost:#{port}#{@baseURI}"

        @server = require('http').createServer(@app)
        @server.listen port, callback


    stop: (callback) ->
        unless @server
            throw "Server not started"
        @server.close callback


module.exports = Server
