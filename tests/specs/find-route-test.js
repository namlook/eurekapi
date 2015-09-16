
import Lab from 'lab';
var lab = exports.lab = Lab.script();

import Code from 'code';
var describe = lab.describe;
var it = lab.it;
var beforeEach = lab.beforeEach;
var expect = Code.expect;

import eureka from '../../lib';
import config from '../config';
import fixtures from '../utils/fixtures';


describe('Route [find]', function() {

    /** load the server **/
    var server;
    lab.before(function(done) {
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


    it('should return all documents', function(done){
        let options = {
            method: 'GET',
            url: '/api/1/generic'
        };

        server.inject(options, function(response) {
            expect(response.statusCode).to.equal(200);

            var data = response.result.data;
            expect(data).to.be.an.array();
            expect(data.length).to.be.equal(10);

            done();
        });
    });

    it('should filter by id', function(done){
        let options = {
            method: 'GET',
            url: '/api/1/generic?filter[id]=generic3'
        };

        server.inject(options, function(response) {
            expect(response.statusCode).to.equal(200);

            var data = response.result.data;
            expect(data).to.be.an.array();
            expect(data.length).to.be.equal(1);
            expect(data[0].id).to.equal('generic3');
            expect(data[0].attributes).to.exist();
            done();
        });
    });

    it('should filter by ids', function(done){
        let options = {
            method: 'GET',
            url: '/api/1/generic?filter[id][$in]=["generic3","generic2"]'
        };

        server.inject(options, function(response) {
            expect(response.statusCode).to.equal(200);

            var data = response.result.data;
            expect(data).to.be.an.array();
            expect(data.length).to.be.equal(2);
            expect(data[0].id).to.equal('generic3');
            expect(data[0].attributes).to.exist();
            expect(data[1].id).to.equal('generic2');
            expect(data[1].attributes).to.exist();
            done();
        });
    });

    it('should sort the documents', function(done){

        let options = {
            method: 'GET',
            url: `/api/1/generic?sort=-integer`
        };

        server.inject(options, function(response) {
            expect(response.statusCode).to.equal(200);

            let data = response.result.data;
            expect(data).to.be.an.array();
            expect(data.length).to.be.equal(10);
            expect(data.map((o) => {
                return o.attributes.integer;
            })).to.deep.equal([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
            done();
        });
    });

    it('should limit the documents', function(done){

        let options = {
            method: 'GET',
            url: `/api/1/generic?limit=5`
        };

        server.inject(options, function(response) {
            expect(response.statusCode).to.equal(200);

            let data = response.result.data;
            expect(data).to.be.an.array();
            expect(data.length).to.be.equal(5);
            done();
        });
    });

    it('should return only the specified fields', function(done){
        let options = {
            method: 'GET',
            url: `/api/1/generic?fields=["integer","text"]`
        };

        server.inject(options, function(response) {
            expect(response.statusCode).to.equal(200);

            let data = response.result.data;
            expect(data).to.be.an.array();
            data.forEach(function(item) {
                expect(item.attributes).to.only.include(['integer', 'text']);
                expect(item.relationships).to.not.exist();
            });
            done();
        });
    });

    it('should include all relations of a collection', function(done){

        let options = {
            method: 'GET',
            url: `/api/1/generic?include=1`
        };

        server.inject(options, function(response) {
            expect(response.statusCode).to.equal(200);

            var included = response.result.included;
            expect(included).to.be.an.array();
            expect(included.length).to.equal(5);
            expect(included.map((item) => item.id)).to.only.include([
                'relation0',
                'relation1',
                'relation2',
                'relation3',
                'relation4'
            ]);
            done();
        });
    });


    it('should include a specified relation of a collection', function(done){

        let options = {
            method: 'GET',
            url: `/api/1/generic?include=relation`
        };

        server.inject(options, function(response) {
            expect(response.statusCode).to.equal(200);

            var included = response.result.included;
            expect(included).to.be.an.array();
            expect(included.length).to.equal(2);
            expect(included.map((item) => item.id)).to.only.include([
                'relation0', 'relation1']);
            done();
        });
    });

    it('should include all relations of a document', function(done){

        let options = {
            method: 'GET',
            url: `/api/1/generic/generic1?include=1`
        };

        server.inject(options, function(response) {
            expect(response.statusCode).to.equal(200);

            var included = response.result.included;
            expect(included).to.be.an.array();
            expect(included.map((item) => item.id)).to.only.include([
                'relation0', 'relation1', 'relation2']);
            done();
        });
    });


    it('should allow $in operator', function(done){

        let options = {
            method: 'GET',
            url: `/api/1/generic?filter[integer][$in]=[2,4,6]`
        };

        server.inject(options, function(response) {
            expect(response.statusCode).to.equal(200);

            var data = response.result.data;
            expect(data).to.be.an.array();
            expect(data.length).to.be.equal(3);
            data.forEach(function(item) {
                expect(item.attributes.integer).to.satisfy((num) => [2, 4, 6].indexOf(num) > -1);
            });

            done();
        });
    });


    it('should query relations', function(done){

        let options = {
            method: 'GET',
            url: `/api/1/generic?filter[relation.text]=relation 1`
        };

        server.inject(options, function(response) {
            expect(response.statusCode).to.equal(200);

            var data = response.result.data;
            expect(data).to.be.an.array();
            expect(data.length).to.be.equal(5);
            data.forEach(function(item) {
                expect(item.attributes.integer).to.satisfy((num) => [1, 3, 7, 5, 9].indexOf(num) > -1);
            });

            done();
        });
    });


    it('should return an error if a field in query is not specified in schema', function(done){

        let options = {
            method: 'GET',
            url: `/api/1/generic?filter[unknwonField]=3`
        };

        server.inject(options, function(response) {
            expect(response.statusCode).to.equal(400);

            let error = response.result.errors[0];
            expect(error.status).to.equal(400);
            expect(error.title).to.equal('Bad Request');
            expect(error.detail).to.equal('ValidationError: malformed query');
            expect(error.meta.infos).to.equal('unknown property "unknwonField" on model "Generic"');

            done();
        });
    });



    it('should return an error when query with a bad operator', function(done){

        let options = {
            method: 'GET',
            url: `/api/1/generic?filter[integer][$arf]=3`
        };

        server.inject(options, function(response) {
            expect(response.statusCode).to.equal(400);

            let error = response.result.errors[0];
            expect(error.status).to.equal(400);
            expect(error.title).to.equal('Bad Request');
            expect(error.detail).to.equal('ValidationError: malformed query');
            expect(error.meta.infos).to.equal('unknown operator "$arf"');

            done();
        });
    });

    it('should return an error when query with a bad type', function(done){

        let options = {
            method: 'GET',
            url: `/api/1/generic?filter[integer]=bla&filter[boolean]=arf`
        };

        server.inject(options, function(response) {
            expect(response.statusCode).to.equal(400);

            let error = response.result.errors[0];
            expect(error.status).to.equal(400);
            expect(error.title).to.equal('Bad Request');
            expect(error.detail).to.equal('ValidationError: malformed query');
            expect(error.meta.infos).to.equal('"integer" must be a number');

            done();
        });
    });

    it('should return an error when query with a bad relation type', function(done){

        let options = {
            method: 'GET',
            url: `/api/1/generic?filter[relation.related]=bla`
        };

        server.inject(options, function(response) {
            expect(response.statusCode).to.equal(400);

            let error = response.result.errors[0];
            expect(error.status).to.equal(400);
            expect(error.title).to.equal('Bad Request');
            expect(error.detail).to.equal('ValidationError: malformed query');
            expect(error.meta.infos).to.equal('"related" must be a boolean');

            done();
        });

    });

    it('should return an error when specified a bad property in array', function(done){

        let options = {
            method: 'GET',
            url: `/api/1/generic?fields=["boolean","unknownProperty"]`
        };

        server.inject(options, function(response) {
            expect(response.statusCode).to.equal(400);

            let error = response.result.errors[0];
            expect(error.status).to.equal(400);
            expect(error.title).to.equal('Bad Request');
            expect(error.detail).to.equal('ValidationError: malformed options');
            expect(error.meta.infos).to.equal('unknown property "unknownProperty" on model "Generic"');

            done();
        });
    });

    it('should return an error when specified a bad property as string', function(done){

        let options = {
            method: 'GET',
            url: `/api/1/generic?fields=boolean,unknownProperty`
        };

        server.inject(options, function(response) {
            expect(response.statusCode).to.equal(400);

            let error = response.result.errors[0];
            expect(error.status).to.equal(400);
            expect(error.title).to.equal('Bad Request');
            expect(error.detail).to.equal('ValidationError: malformed options');
            expect(error.meta.infos).to.equal('unknown property "unknownProperty" on model "Generic"');

            done();
        });
    });


    it('should return an error when sorting with an unknown property as array', function(done){

        let options = {
            method: 'GET',
            url: `/api/1/generic?sort=["boolean","unknownProperty"]`
        };

        server.inject(options, function(response) {
            expect(response.statusCode).to.equal(400);

            let error = response.result.errors[0];
            expect(error.status).to.equal(400);
            expect(error.title).to.equal('Bad Request');
            expect(error.detail).to.equal('ValidationError: malformed options');
            expect(error.meta.infos).to.equal('unknown property "unknownProperty" on model "Generic"');

            done();
        });

    });


    it('should return an error when sorting with an unknown property as string', function(done){

        let options = {
            method: 'GET',
            url: `/api/1/generic?sort=boolean,unknownProperty`
        };

        server.inject(options, function(response) {
            expect(response.statusCode).to.equal(400);

            let error = response.result.errors[0];
            expect(error.status).to.equal(400);
            expect(error.title).to.equal('Bad Request');
            expect(error.detail).to.equal('ValidationError: malformed options');
            expect(error.meta.infos).to.equal('unknown property "unknownProperty" on model "Generic"');

            done();
        });

    });

});
