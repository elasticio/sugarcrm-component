const sinon = require('sinon');
const expect = require('chai').expect;
const nock = require('nock');
const SugarCrm = require('../../lib/sugarcrm');
const deleteObject = require('../../lib/actions/deleteObject');
const lookupObject = require('../../lib/actions/lookupObject');
const upsertObject = require('../../lib/actions/upsertObject');

describe('Actions Unit Test', async () => {
    const authTokenResponse = {
        expires_in: 100,
        refresh_expires_in: 100,
        access_token: 'access token'
    };
    nock('https://baseurl.com')
        .post('/rest/v10/oauth2/token')
        .reply(200, authTokenResponse);
    it('should return deleted object message', async () => {
        const cfg = {
            password: 'password',
            clientID: 'clientID',
            clientSecret: 'clientSecret',
            userName: 'userName',
            protocol: 'https:',
            module: 'Contacts',
            baseUrl: 'baseUrl.com',
            oauth: {
                expires_in: 100,
                refresh_expires_in: 100
            }
        };
        const msg = {
            body: {
                id: 'testid'
            }
        };
        const emitter = {
            emit: sinon.spy()
        };
        nock('https://baseUrl.com')
            .delete('/rest/v10/Contacts/testid')
            .reply(200, {
                message: 'Object successfully deleted'
            });
        await deleteObject.process.call(emitter, msg, cfg);
        expect(emitter.emit.calledTwice).to.equal(true);
        expect(emitter.emit.args[0][0]).to.equal('updateKeys');
        expect(emitter.emit.args[1][1].body.message).to.equal('Object successfully deleted');
    });

    it('should return object found message', async () => {
        const cfg = {
            password: 'password',
            clientID: 'clientID',
            clientSecret: 'clientSecret',
            userName: 'userName',
            protocol: 'https:',
            module: 'Contacts',
            baseUrl: 'baseUrl.com',
            oauth: {
                expires_in: 100,
                refresh_expires_in: 100
            }
        };
        const msg = {
            body: {
                id: 'testid'
            }
        };
        const emitter = {
            emit: sinon.spy()
        };
        nock('https://baseUrl.com')
            .get('/rest/v10/Contacts/testid')
            .reply(200, {
                message: 'Object successfully found'
            });
        await lookupObject.process.call(emitter, msg, cfg);
        expect(emitter.emit.calledTwice).to.equal(true);
        expect(emitter.emit.args[0][0]).to.equal('updateKeys');
        expect(emitter.emit.args[1][1].body.message).to.equal('Object successfully found');
    });

    it('should do something', async () => {
        const cfg = {
            password: 'password',
            clientID: 'clientID',
            clientSecret: 'clientSecret',
            userName: 'userName',
            protocol: 'https:',
            module: 'Contacts',
            baseUrl: 'baseUrl.com',
            oauth: {
                expires_in: 100,
                refresh_expires_in: 100
            }
        };
        const msg = {
            body: {
                id: 'testid',
                key1: 'value1',
                key2: 'value2',
                key3: 'value3'
            }
        };
        const emitter = {
            emit: sinon.spy()
        };
        nock('https://baseUrl.com')
            .put('/rest/v10/Contacts/testid')
            .reply(200, {
                message: 'Object successfully upserted'
            });
        await upsertObject.process.call(emitter, msg, cfg);
        expect(emitter.emit.calledTwice).to.equal(true);
        expect(emitter.emit.args[0][0]).to.equal('updateKeys');
        expect(emitter.emit.args[1][1].body.message).to.equal('Object successfully upserted');
    });
});
