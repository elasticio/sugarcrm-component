describe('sugarCRM query opportunities', function () {
    var nock = require('nock');
    var trigger = require('../../lib/triggers/getOpportunities');

    var cfg = {
        baseUrl: 'test.com'
    };

    var self;
    beforeEach(function() {
        self = jasmine.createSpyObj('self', ['emit']);
    });
    it('should emit msg, snapshot, end events on success request', function () {
        nock('https://test.com/')
            .post('/rest/v10/oauth2/token')
            .reply(200, {access_token: 1})
            .get('/rest/v10/Opportunities')
            .reply(200, require('../data/list.out.json'));

        runs(function(){
            trigger.process.call(self, {}, cfg, {});
        });

        waitsFor(function(){
            return self.emit.calls.length;
        });

        runs(function(){
            var calls = self.emit.calls;
            expect(calls.length).toEqual(23);
            expect(calls[21].args[0]).toEqual('snapshot');
            expect(calls[21].args[1]['c24c4069-7092-b95d-c040-523cc74a3d06'])
                .toEqual('e63371ee008f60dd4120b752edd17758');
            expect(calls[22].args[0]).toEqual('end');
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
            .get('/rest/v10/Opportunities')
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
