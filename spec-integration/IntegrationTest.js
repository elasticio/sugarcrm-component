'use strict';

const expect = require('chai').expect;
const getEntry = require('../lib/triggers/getEntitiesPolling');
const SugarCrm = require('../lib/sugarcrm');
const TestEmitter = require('./TestEmitter');
const verifyCredentials = require('../verifyCredentials');
const createEntry = require('../lib/actions/createEntry');
const updateEntry = require('../lib/actions/updateEntry');
const getEntitiesWebhook = require('../lib/triggers/getEntitiesWebhook');
const getDeletedEntitiesWebhook = require('../lib/triggers/getDeletedEntitiesWebhook');
const lookupEntry = require('../lib/actions/lookupEntry');

describe('Integration Test', function GetEntryTest() {
    let username;
    let password;
    let appId;
    let appSecret;
    let sugarDoman;
    let cfg;

    this.timeout(10000);

    before(function Setup() {
        if (process.env.NODE_ENV === 'local') {
            require('dotenv').config();
        }

        username = process.env.SUGAR_USERNAME;
        password = process.env.PASSWORD;
        appId = process.env.OAUTH_APPLICATION_ID;
        appSecret = process.env.OAUTH_APPLICATION_SECRET;
        sugarDoman = process.env.SUGAR_URL;
    });

    beforeEach(function BeforeEach() {
        cfg = {
            clientID: appId,
            clientSecret: appSecret,
            userName: username,
            password: password,
            baseUrl: sugarDoman
        };
    });

    describe('Webhook setup tests', function SetupWebhookTests() {
        it('Webhook Startup - Shutdown', async function StartupShutdownTest() {
            cfg.module = 'Contacts';
            [getEntitiesWebhook, getDeletedEntitiesWebhook].forEach(async (webhook) => {
                const result = await webhook.startup.call(undefined, cfg);
                await webhook.shutdown.call(undefined, cfg, result);
            });
        });
    });

    describe('Get Entry Tests', function GetEntryTests() {
        it('Get Entry', async function GetEntryTests() {
            const emitter = new TestEmitter();
            const msg = {};
            cfg.newUpdatedOrAll = 'all';
            cfg.returnIndividually = 'individually';
            cfg.module = 'Contacts';
            cfg.maxNum = '1';

            const initialSnapshot = undefined;

            await getEntry.process.call(emitter, msg, cfg, initialSnapshot);

            expect(emitter.snapshot.length).to.equal(1);
            expect(emitter.data.length).to.equal(1);
            expect(emitter.data[0]).to.be.a('object');

            cfg.oauth = emitter.keys[0].oauth;
            delete cfg.maxNum;

            await getEntry.process.call(emitter, msg, cfg, emitter.snapshot[0]);

            expect(emitter.data.length).to.be.above(1);
            expect(emitter.data[1]).to.be.a('object');
            expect(emitter.data[1]).to.not.deep.equal(emitter.data[0]);
        });
    });

    describe('Metadata tests', function MetadataTests() {
        it('Get Modules', async function GetModules() {
            const modules = await getEntry.modules(cfg);

            expect(modules.Contacts).to.equal('Contacts');
        });

        it('Build in schema', async function BuildInSchemaTest() {
            cfg.module = 'Contacts';
            const schema = await createEntry.getMetaModel(cfg);

            expect(schema.in.properties.id.required).to.be.true;
            expect(schema.in.properties.date_modified).to.not.exist;
        });

        it('Build out schema', async function BuildOutSchemaTest() {
            cfg.module = 'Contacts';
            const schema = await getEntitiesWebhook.getMetaModel(cfg);

            expect(schema.out.properties.id.required).to.be.true;
            expect(schema.out.properties.date_modified).to.exist;
        });
    });

    describe('Token Exchange tests', function VerifyTokenExchangeTests() {
        it('Token tests', async function TokenExchangeTests() {
            // First test password -> token exchange
            const emitter = new TestEmitter();
            const instance1 = new SugarCrm(cfg, emitter);

            await instance1.makeRequest('ping', 'GET');

            expect(emitter.keys.length).to.equal(1);
            const accessToken1 = emitter.keys[0].oauth.access_token;
            expect(accessToken1).to.exist;

            // Then check token -> token exchange
            cfg.password = 'wrongPassword';
            cfg.oauth = emitter.keys[0].oauth;
            cfg.oauth.access_token_expiry = (new Date(0)).toISOString();
            const instance2 = new SugarCrm(cfg, emitter);
            await instance2.makeRequest('ping', 'GET');
            expect(emitter.keys.length).to.equal(2);
            const accessToken2 = emitter.keys[1].oauth.access_token;
            expect(accessToken2).to.exist;
            expect(accessToken1).to.not.equal(accessToken2);
        });
    });

    describe('Verify Credentials Tests', function VerifyCredentialsTests() {
        it('Correct Password', async function CorrectPasswordTest() {
            const authResult = await verifyCredentials.call({}, cfg);
            expect(authResult).to.be.true;
        });

        it('Incorrect Password', async function IncorrectPasswordTest() {
            cfg.password = 'WrongPassword';
            const authResult = await verifyCredentials.call({}, cfg);
            expect(authResult).to.be.false;
        });
    });

    describe('Action Tests', function ActionTests() {
        it('Create Contact and Then Update', async function CreateAndThenContact() {
            const id = Math.random();
            const emitter = new TestEmitter();
            const msg = {
                body: {
                    name: 'CreateIntegrationTestContact',
                    description: `Created at ${(new Date()).toISOString()}`,
                    externalid_c: id
                }
            };
            cfg.module = 'Contacts';

            const newEntry = await createEntry.process.call(emitter, msg, cfg);

            const originalId = newEntry.id;
            expect(originalId).to.exist;

            newEntry.id = id;
            newEntry.description = `${newEntry.description}\nUpdated at ${(new Date()).toISOString()}`;
            cfg.externalIdProperty = 'externalid_c';

            const updatedEntry = await updateEntry.process.call(emitter, {
                body: newEntry
            }, cfg);
            expect(updatedEntry.id).to.exist;
            expect(updatedEntry.id).to.be.equal(originalId);
        });

        it('Upsert test', async function UpsertTest() {
            const id = Math.random();
            const emitter = new TestEmitter();
            const msg = {
                body: {
                    name: 'UpsertIntegrationTestContact',
                    description: `Created at ${(new Date()).toISOString()}`,
                    externalid_c: id
                }
            };
            cfg.module = 'Contacts';

            const newEntry = await createEntry.process.call(emitter, msg, cfg);

            const originalId = newEntry.id;
            expect(originalId).to.exist;

            newEntry.id = id;
            newEntry.description = `${newEntry.description}\nUpdated at ${(new Date()).toISOString()}`;
            cfg.externalIdProperty = 'externalid_c';

            const updatedEntry = await updateEntry.process.call(emitter, {
                body: newEntry
            }, cfg);
            expect(updatedEntry.id).to.exist;
            expect(updatedEntry.id).to.be.equal(originalId);
        });

        it('Lookup test', async function LookupTest() {
            const idToLookup = '64cdddcc-b7fa-11e7-b68e-02e359029409';
            const msg = {
                body: {
                    id: idToLookup
                }
            };
            cfg.module = 'Contacts';
            const result = await lookupEntry.process(msg, cfg);
            expect(result.name).to.be.equal('Fred Jones');
        });

    });
});
