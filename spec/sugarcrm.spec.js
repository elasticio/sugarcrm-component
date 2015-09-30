describe('sugarcrm.js', function () {
    var nock = require('nock');
    var sugarcrm = require('../lib/sugarcrm.js');
    var instance = sugarcrm({baseUrl: 'test.com'});

    describe('setup', function () {
        it('queries should return new baseUrl for updated config', function () {
            expect(instance.getConfig().baseUrl).toEqual('test.com');
        });
    });
    describe('getList', function () {
        var expectedResult = require('./data/list.result.json');
        var result;
        beforeEach(function () {
            nock('https://test.com/')
                .get('/rest/v10/Accounts')
                .reply(200, require('./data/list.out.json'));
            instance
                .getList('Accounts', {})
                .then(function (data) {
                    result = data;
                });
            waitsFor(function () {
                return result;
            });
        });
        afterEach(function () {
            result = null;
        });
        it('should return proper hashmap', function () {
            expect(result).toEqual(expectedResult);
        });
    });

    describe('auth', function () {
        it('should return promise resolve on success auth check', function (done) {
            nock('https://test.com/')
                .post('/rest/v10/oauth2/token')
                .reply(200, {access_token: 1});
            instance.auth()
                .then(function(message){
                    expect(message).toBeUndefined();
                }, function(error){
                    expect(error).toBeUndefined();
                }).finally(done);
        });

        it('should return promise reject on auth check failure', function (done) {
            nock('https://test.com/')
                .post('/rest/v10/oauth2/token')
                .reply(401);
            instance.auth()
                .then(function(message){
                    expect(message).toBeUndefined();
                }, function(error){
                    expect(error).toFail();
                }).finally(done);
        });
    });

    describe('getHash', function () {
        it('should return proper hash', function () {
            expect(instance.getHash('test')).toEqual('303b5c8988601647873b4ffd247d83cb');
        });
    });
});