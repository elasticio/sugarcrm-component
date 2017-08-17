describe('sugarCRM query accounts', function () {
    var nock = require('nock');
    var trigger = require('../../lib/triggers/getAccounts');

    var cfg = {
        baseUrl: 'test.com'
    };

    var self;
    beforeEach(function() {
        self = jasmine.createSpyObj('self', ['emit']);
    });
    iit('should emit msg, snapshot events on success request', function () {
        nock('https://test.com/')
            .post('/rest/v10/oauth2/token')
            .reply(200, {access_token: 1})
            .post('/rest/v10/Accounts/filter')
            .reply(200, require('../data/list.out.json'));

        runs(function(){
            trigger.process.call(self, {}, cfg, {});
        });

        waitsFor(function(){
            return self.emit.calls.length > 0;
        });

        runs(function(){
            var calls = self.emit.calls;
            expect(calls.length).toEqual(2);
            expect(calls[0].args[0]).toEqual('data');
            expect(calls[0].args[1].body.data.length).toEqual(20);
            expect(calls[1].args[0]).toEqual('snapshot');
        });
    });

    it('should emit error, end events on failed auth', function () {
        nock('https://test.com/')
            .post('/rest/v10/oauth2/token')
            .reply(401);

        runs(function(){
            trigger.process.call(self, {}, cfg, {});
        });

        waitsFor(function(){
            return self.emit.calls.length;
        });

        runs(function(){
            var calls = self.emit.calls;
            expect(calls.length).toEqual(2);
            expect(calls[0].args[0]).toEqual('error');
            expect(calls[1].args[0]).toEqual('end');
        });
    });

    it('should emit error, end events on failed list request', function () {
        nock('https://test.com/')
            .post('/rest/v10/oauth2/token')
            .reply(200, {access_token: 1})
            .get('/rest/v10/Accounts')
            .reply(501);

        runs(function(){
            trigger.process.call(self, {}, cfg, {});
        });

        waitsFor(function(){
            return self.emit.calls.length;
        });

        runs(function(){
            var calls = self.emit.calls;
            expect(calls.length).toEqual(2);
            expect(calls[0].args[0]).toEqual('error');
            expect(calls[1].args[0]).toEqual('end');
        });
    });
});
