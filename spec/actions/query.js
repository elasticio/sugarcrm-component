describe('sugarCRM run filter query', function () {
    var nock = require('nock');
    var action = require('../../lib/triggers/query');
    var cfg = {
        baseUrl: 'test.com'
    };

    var self;
    beforeEach(function() {
        self = jasmine.createSpyObj('self', ['emit']);
    });
    it('should emit msg, snapshot, end events on success create request', function () {
        nock('https://test.com/')
            .post('/rest/v10/oauth2/token')
            .reply(200, {access_token: 1})
            .post('/rest/v10/Tasks/filter')
            .reply(200, require('../data/list.out.json').records[0]);

        runs(function(){
            action.process.call(self, {body: {module: 'Tasks', query: JSON.stringify({filter: [{}]})}}, cfg, {});
        });

        waitsFor(function(){
            return self.emit.calls.length;
        });

        runs(function(){
            var calls = self.emit.calls;
            expect(calls.length).toEqual(3);
            expect(calls[0].args[0]).toEqual('data');
            expect(calls[1].args[0]).toEqual('updateSnapshot');
            expect(calls[1].args[1].$set.test)
                .toEqual('c24c4069-7092-b95d-c040-523cc74a3d06');
            expect(calls[2].args[0]).toEqual('end');
        });
    });

    it('should correctly format module param', function () {
        nock('https://test.com/')
            .post('/rest/v10/oauth2/token')
            .reply(200, {access_token: 1})
            .post('/rest/v10/Tasks/filter')
            .reply(200, require('../data/list.out.json').records[0]);

        runs(function(){
            action.process.call(
                self,
                {body: {module: 'tAsKs', query: JSON.stringify({filter: [{}]})}},
                cfg,
                {test: 'c24c4069-7092-b95d-c040-523cc74a3d06'}
            );
        });

        waitsFor(function(){
            return self.emit.calls.length;
        });

        runs(function(){
            var calls = self.emit.calls;
            expect(calls.length).toEqual(3);
            expect(calls[0].args[0]).toEqual('data');
            expect(calls[1].args[0]).toEqual('updateSnapshot');
            expect(calls[1].args[1].$set.test)
                .toEqual('c24c4069-7092-b95d-c040-523cc74a3d06');
            expect(calls[2].args[0]).toEqual('end');
        });
    });

    it('should emit error, end events on failed auth', function () {
        nock('https://test.com/')
            .post('/rest/v10/oauth2/token')
            .reply(401);

        runs(function(){
            action.process.call(self, {body: {module: 'Tasks', query: JSON.stringify({filter: [{}]})}}, cfg, {});
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

    it('should emit error, end events on failed create request', function () {
        nock('https://test.com/')
            .post('/rest/v10/oauth2/token')
            .reply(200, {access_token: 1})
            .post('/rest/v10/Tasks/filter')
            .reply(501);

        runs(function(){
            action.process.call(self, {body: {module: 'Tasks', query: JSON.stringify({filter: [{}]})}}, cfg, {});
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
    it('should emit error if query params is not json', function () {
        runs(function(){
            action.process.call(self, {body: {module: 'Tasks', query: 'abc'}, cfg, {});
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
