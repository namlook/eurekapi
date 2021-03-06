
import joi from 'joi';
import Glue from 'glue';

import Inert from 'inert';
import HapiMailer from 'hapi-mailer';
import HapiAuthBasic from 'hapi-auth-basic';
import HapiAuthJwt from 'hapi-auth-jwt';
import HapiQs from 'hapi-qs';
import archimedesPlugin from './plugins/archimedes';
import eurekaPlugin from './plugins/eureka';

// var exampleConfig = {
//     port: 5000,
//     log: ['warn'],
//     app: {
//         secret: 'ssh',
//         email: 'contact@project.com',
//         clientRootUrl: 'http://www.project.com',
//         apiRootPrefix: '/api/1'
//     },
//     mailer: {
//         // hapi-mailer config
//     },
//     database: {
//         adapter: 'rdf',
//         schemas: requireDir('./schemas'),
//         config: {
//             engine: 'virtuoso',
//             graphUri: 'http://test.org',
//             host: 'localhost',
//             port: 8890
//         }
//     },
//     resources: requireDir('./resources')
// };

var eurekaConfigValidator = {
    name: joi.string(),
    host: joi.string().required(),
    port: joi.number().required(),
    log: [joi.string(), joi.array(joi.string())],
    auth: joi.boolean(),
    app: joi.object().keys({
        secret: joi.string().required(),
        apiRootPrefix: joi.string().required(),
        email: joi.string().email().required(),
        clientRootUrl: joi.string().uri().required()
    }),
    publicDirectory: joi.string().default('dist'),
    database: joi.object().keys({
        adapter: joi.string().required().only(['rdf']),
        schemas: joi.object(),
        config: joi.object().keys({
            engine: joi.string().required().only(['virtuoso', 'blazegraph']),
            // type: joi.string().required(),
            // dialect: joi.string(),
            // host: joi.string().ip().default('localhost'),
            graphUri: joi.string().uri().required(),
            // endpoint: joi.string().uri(),
            host: joi.string().required(),
            port: joi.number(),
            auth: joi.object().keys({
                user: joi.string().required(),
                password: joi.string().required()
            }).with('user', 'password')
        }).required()
    }),
    redis: joi.object().keys({
        port: joi.number().required(),
        host: joi.string().required()
    }),
    fileUploads: joi.object().keys({
        maxBytes: joi.number().integer().default(50 * Math.pow(1024, 2)),
        uploadDirectory: joi.string().default()
    }),
    resources: joi.object(),
    tasks: joi.object(),
    mailer: joi.object(),
    misc: joi.object() // place to put custom config here
};

export default function(eurekaConfig) {
    var {error, value: config} = joi.validate(eurekaConfig, eurekaConfigValidator);

    if (error) {
        console.error(error);
        console.error(error.details);
        throw error;
    }

    var manifest = {
        connections: [
            {
                port: config.port,
                routes: {cors: true}
            }
        ],
        server: {
            app: config.app
        }
    };

    return {
        manifest: manifest,

        beforeRegister: function(server, next) {
            next();
        },

        afterRegister: function(server, next) {
            next();
        },

        beforeStart: function(server, next) {
            next();
        },

        /**
         * compose the server and register plugins
         */
        compose: function(callback) {
            var that = this;

            Glue.compose(manifest, function(composeErr, server) {
                if (composeErr) {
                    return callback(composeErr);
                }

                that.beforeRegister(server, function(beforeRegisterErr) {
                    if (beforeRegisterErr) {
                        return callback(beforeRegisterErr);
                    }


                    var archimedesPluginConfig = {
                        log: config.log,
                        database: {
                            adapter: config.database.adapter,
                            config: config.database.config
                        },
                        schemas: config.database.schemas
                    };


                    var eurekaPluginConfig = {
                        log: config.log,
                        resources: config.resources,
                        tasks: config.tasks,
                        apiRootPrefix: config.app.apiRootPrefix,
                        serverConfig: config
                    };

                    /**
                     * register plugins
                     */
                    server.register([
                        HapiQs,
                        Inert,
                        {register: HapiMailer, options: config.mailer},
                        HapiAuthBasic,
                        HapiAuthJwt,
                        {register: archimedesPlugin, options: archimedesPluginConfig},
                        {register: eurekaPlugin, options: eurekaPluginConfig}

                    ], function(registerErr) {
                        if (registerErr) {
                            return callback(registerErr);
                        }


                        that.afterRegister(server, function(afterRegisterErr) {
                            if (afterRegisterErr) {
                                return callback(afterRegisterErr);
                            }

                            callback(null, server);
                        });
                    });
                });
            });
        },

        /**
         * compose, register plugins and start the server
         *
         * @returns a promise which resolve into the started server
         */
        start: function() {
            return new Promise((resolve, reject) => {
                this.compose((composeErr, server) => {
                    if (composeErr) {
                        return reject(composeErr);
                    }

                    this.beforeStart(server, (onPreStartErr) => {
                        if (onPreStartErr) {
                            return reject(onPreStartErr);
                        }

                        server.start((startErr) => {
                            if (startErr) {
                                return reject(startErr);
                            }
                            return resolve(server);
                        });
                    });
                });
            });

        }
    };
}
