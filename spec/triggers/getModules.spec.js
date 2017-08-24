ddescribe('sugarCRM query tests', function () {
    var nock = require('nock');
    var modules = ['Accounts', 'Contacts', 'Leads', 'Opportunities'];

    var cfg = {
        baseUrl: 'test.com',
        auth: {
            access_token: 1,
            access_token_expiry: new Date((new Date()).getTime() + 7000)
        }
    };

    var self;
    beforeEach(function() {
        self = jasmine.createSpyObj('self', ['emit']);
    });
    it('should emit msg, snapshot events on success request', function () {
        modules.forEach(module => {
            var trigger = require(`../../lib/triggers/get${module}`);

            nock('https://test.com/')
                .post(`/rest/v10/${module}/filter`)
                .reply(200, require('../data/list.out.json'));

            runs(function () {
                trigger.process.call(self, {}, cfg, {});
            });

            waitsFor(function () {
                return self.emit.calls.length > 0;
            });

            runs(function () {
                var calls = self.emit.calls;
                expect(calls.length).toEqual(2);
                expect(calls[0].args[0]).toEqual('data');
                expect(calls[0].args[1].body.data.length).toEqual(20);
                expect(calls[1].args[0]).toEqual('snapshot');
            });
        });
    });
});
