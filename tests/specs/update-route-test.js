
import Lab from 'lab';
var lab = exports.lab = Lab.script();

import Code from 'code';
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var beforeEach = lab.beforeEach;
var expect = Code.expect;

import eureka from '../../lib';
import config from '../config';
import fixtures from '../utils/fixtures';

describe('Route [update]', function() {

    /** load the server **/
    var server;
    before(function(done) {
        eureka(config).compose(function(err, s) {
            expect(err).to.not.exists();
            server = s;
            done();
        });
    });


     /** load the fixtures **/
    beforeEach(function(done){
        fixtures.clear(server).then(() => {
            return fixtures.genericDocuments(server);
        }).then(() => {
            done();
        }).catch((error) => {
            console.log(error);
        });
    });


    it('should update a document', function(done){
        let patchOptions = {
            method: 'PATCH',
            url: `/api/1/generic/generic3`,
            payload: {
                data: {
                    id: 'generic3',
                    type: 'Generic',
                    attributes: {
                        text: 'yes baby',
                        integer: 42
                    }
                }
            }
        };

        server.inject(patchOptions, function(patchResponse) {
            expect(patchResponse.statusCode).to.equal(200);
            let data = patchResponse.result.data;
            expect(data.id).to.equal('generic3');
            expect(data.attributes.text).to.equal('yes baby');
            expect(data.attributes.boolean).to.equal(true);
            expect(data.attributes.integer).to.equal(42);

            let options = {
                method: 'GET',
                url: '/api/1/generic/generic3'
            };
            server.inject(options, function(response) {
                expect(response.statusCode).to.equal(200);
                var generic3 = response.result.data;

                expect(generic3.attributes.text).to.equal('yes baby');
                expect(generic3.attributes.integer).to.equal(42);
                expect(generic3.attributes.boolean).to.equal(true);

                done();
            });
        });
    });


    it('should update relationships', function(done){
        let patchOptions = {
            method: 'PATCH',
            url: `/api/1/generic/generic3`,
            payload: {
                data: {
                    id: 'generic3',
                    type: 'Generic',
                    attributes: {
                        text: 'modified'
                    },
                    relationships: {
                        relation: {
                            data: {id: 'relation2', type: 'GenericRelation'}
                        },
                        relations: {
                            data: [
                                {id: 'relation8', type: 'GenericRelation'},
                                {id: 'relation9', type: 'GenericRelation'}
                            ]
                        }
                    }
                }
            }
        };

        server.inject(patchOptions, function(patchResponse) {
            expect(patchResponse.statusCode).to.equal(200);
            let data = patchResponse.result.data;
            expect(data.id).to.equal('generic3');
            expect(data.attributes.text).to.equal('modified');
            expect(data.attributes.boolean).to.equal(true);
            expect(data.attributes.integer).to.equal(3);
            expect(data.relationships.relation.data.id).to.equal('relation2');

            let options = {
                method: 'GET',
                url: '/api/1/generic/generic3'
            };
            server.inject(options, function(response) {
                expect(response.statusCode).to.equal(200);
                var generic3 = response.result.data;

                expect(generic3.attributes.text).to.equal('modified');
                expect(generic3.relationships.relation.data.id).to.equal('relation2');
                expect(generic3.relationships.relation.links.self).to.match(/\/generic3\/relationships\/relation/);
                expect(generic3.relationships.relation.links.related).to.match(/\/generic3\/relation/);
                expect(generic3.relationships.relations.data[0].id).to.equal('relation8');
                expect(generic3.relationships.relations.data[1].id).to.equal('relation9');
                expect(generic3.relationships.relations.links.self).to.match(/\/generic3\/relationships\/relations/);
                expect(generic3.relationships.relations.links.related).to.match(/\/generic3\/relations/);

                done();
            });
        });
    });

    it('should update a targeted relation', function(done){
        let patchOptions = {
            method: 'PATCH',
            url: `/api/1/generic/generic3/relationships/relation`,
            payload: {
                data: {
                    id: 'relation2',
                    type: 'GenericRelation'
                }
            }
        };

        server.inject(patchOptions, function(patchResponse) {
            expect(patchResponse.statusCode).to.equal(204);

            let options = {
                method: 'GET',
                url: '/api/1/generic/generic3'
            };
            server.inject(options, function(response) {
                expect(response.statusCode).to.equal(200);
                var generic3 = response.result.data;
                expect(generic3.relationships.relation.data.id).to.equal('relation2');
                expect(generic3.relationships.relation.links.self).to.match(/\/generic3\/relationships\/relation/);
                expect(generic3.relationships.relation.links.related).to.match(/\/generic3\/relation/);

                done();
            });
        });
    });

    it('should update a targeted relations', function(done){
        let patchOptions = {
            method: 'PATCH',
            url: `/api/1/generic/generic3/relationships/relations`,
            payload: {
                data: [
                    {id: 'relation8', type: 'GenericRelation'},
                    {id: 'relation9', type: 'GenericRelation'}
                ]
            }
        };

        server.inject(patchOptions, function(patchResponse) {
            expect(patchResponse.statusCode).to.equal(204);

            let options = {
                method: 'GET',
                url: '/api/1/generic/generic3'
            };
            server.inject(options, function(response) {
                expect(response.statusCode).to.equal(200);
                var generic3 = response.result.data;
                expect(generic3.relationships.relations.data[0].id).to.equal('relation8');
                expect(generic3.relationships.relations.data[1].id).to.equal('relation9');
                expect(generic3.relationships.relations.links.self).to.match(/\/generic3\/relationships\/relations/);
                expect(generic3.relationships.relations.links.related).to.match(/\/generic3\/relations/);

                done();
            });
        });
    });



    it('should throw a 400 error when passing bad payload', function(done) {
            let options = {
                method: 'PATCH',
                url: `/api/1/generic/generic3`,
                payload: {
                    whatever: 'payload'
                }
            };

            server.inject(options, function(response) {
                expect(response.statusCode).to.equal(400);

                let error = response.result.errors[0];
                expect(error.status).to.equal(400);
                expect(error.title).to.equal('Bad Request');
                expect(error.detail).to.equal('malformed payload');

                done();
            });
    });


    it('should throw a 400 error when updating an unknown property', function(done) {
            let options = {
                method: 'PATCH',
                url: `/api/1/generic/generic3`,
                payload: {
                    data: {
                        id: 'generic3',
                        type: 'Generic',
                        attributes: {
                            unknownProperty: 'arf'
                        }
                    }
                }
            };

            server.inject(options, function(response) {
                expect(response.statusCode).to.equal(400);

                let error = response.result.errors[0];
                expect(error.status).to.equal(400);
                expect(error.title).to.equal('Bad Request');
                expect(error.detail).to.equal('ValidationError: unknown property \"unknownProperty\" on model \"Generic\"');
                done();
            });
    });


    it('should throw a 404 error if the document to update does not exist', function(done) {
            let options = {
                method: 'POST',
                url: `/api/1/generic/generic12`,
                payload: {
                    whatever: 'payload'
                }
            };

            server.inject(options, function(response) {
                expect(response.statusCode).to.equal(404);
                done();
            });
    });

});