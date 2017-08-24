describe('Verify Credentials', function () {
    var nock = require('nock');

    var verify = require('../verifyCredentials.js');

    var cfg;
    var cb;

    var self;

    beforeEach(function () {
        cfg = {baseUrl: 'test.com'};
        cb = jasmine.createSpy('cb');
        self = jasmine.createSpyObj('self', ['emit']);

    });

    it('should return verified false if user did not provide baseUrl required param', function () {
        var cfg = {};

        var result, exception;
        runs(async function() {
            try {
                result = await verify.call(self, cfg, cb);
            } catch (e) {
                exception = e;
            }
        });

        waitsFor(function() {
            return typeof(result) === 'boolean';
        });

        runs(function () {
            expect(e).not.toBeNull();
            expect(e.message).toBe('SugarCRM Configuration is missing base URL');
        });
    });

    it('should return verified false for 401 answer', function () {

        nock('https://test.com')
            .post('/rest/v10/oauth2/token')
            .reply(401, '');

        waitsFor(function () {
            return cb.callCount;
        });

        verify(cfg, cb);

        runs(function () {
            expect(cb).toHaveBeenCalled();
            expect(cb.calls.length).toEqual(1);
            expect(cb).toHaveBeenCalledWith(null, {verified: false});
        });
    });

    it('should return verified true for 200 answer', function () {
        nock('https://test.com')
            .post('/rest/v10/oauth2/token')
            .reply(200, {});

        waitsFor(function () {
            return cb.callCount;
        });

        verify(cfg, cb);

        runs(function () {
            expect(cb).toHaveBeenCalled();
            expect(cb.calls.length).toEqual(1);
            expect(cb).toHaveBeenCalledWith(null, {verified: true});
        });
    });

    it('should return error for 500 cases', function () {

        nock('https://test.com')
            .post('/rest/v10/oauth2/token')
            .reply(500, {message: 'super error 500'});


        waitsFor(function () {
            return cb.callCount;
        });

        verify(cfg, cb);

        runs(function () {
            expect(cb).toHaveBeenCalled();
            expect(cb.calls.length).toEqual(1);
            expect(cb.calls[0].args[0].message)
                .toEqual('bad response from provider: {"message":"super error 500"}');
        });
    });


});