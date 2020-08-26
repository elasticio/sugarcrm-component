'use strict';

const expect = require('chai').expect;
const getObjectsPolling = require('../lib/triggers/getObjectsPolling');
const SugarCrm = require('../lib/sugarcrm');
const TestEmitter = require('./TestEmitter');
const verifyCredentials = require('../verifyCredentials');
const getObjectsWebhook = require('../lib/triggers/getObjectsWebhook');
const getDeletedObjectsWebhook = require('../lib/triggers/getDeletedObjectsWebhook');
const lookupObject = require('../lib/actions/lookupObject');
const deleteObject = require('../lib/actions/deleteObject');
const upsertObject = require('../lib/actions/upsertObject');
const fs = require('fs');
const sinon = require('sinon');
const { Logger } = require('@elastic.io/component-commons-library');

describe('Integration Test', function GetEntryTest() {
    let username;
    let password;
    let appId;
    let appSecret;
    let sugarDomain;
    let platform;

    this.timeout(10000);

    if (fs.existsSync('.env')) {
        require('dotenv').config();
    }

    username = process.env.SUGAR_USERNAME;
    password = process.env.PASSWORD;
    appId = process.env.OAUTH_APPLICATION_ID;
    appSecret = process.env.OAUTH_APPLICATION_SECRET;
    sugarDomain = process.env.SUGAR_URL;
    platform = process.env.PLATFORM;

    const cfg = {
        clientID: appId,
        clientSecret: appSecret,
        userName: username,
        password: password,
        baseUrl: sugarDomain,
        platform
    };


    describe('Webhook setup tests', function SetupWebhookTests() {
        it('Webhook Startup - Shutdown', async function StartupShutdownTest() {
            cfg.module = 'Contacts';
            [getObjectsWebhook, getDeletedObjectsWebhook].forEach(async (webhook) => {
                const result = await webhook.startup.call(undefined, cfg);
                await webhook.shutdown.call(undefined, cfg, result);
            });
        });
    });

    describe('Get Entry Tests', function GetEntryTests() {
        it('Get Entry', async function GetEntryTests() {
            const emitter = new TestEmitter();
            const msg = {};
            cfg.module = 'Contacts';
            cfg.maxNum = '1';

            const initialSnapshot = undefined;

            await getObjectsPolling.process.call(emitter, msg, cfg, initialSnapshot);

            expect(emitter.snapshot.length).to.equal(1);
            expect(emitter.data.length).to.equal(1);
            expect(emitter.data[0]).to.be.a('object');

            cfg.oauth = emitter.keys[0].oauth;
            delete cfg.maxNum;

            await getObjectsPolling.process.call(emitter, msg, cfg, emitter.snapshot[0]);

            expect(emitter.data.length).to.be.above(1);
            expect(emitter.data[1]).to.be.a('object');
            expect(emitter.data[1]).to.not.deep.equal(emitter.data[0]);
        });
    });

    describe('Metadata tests', function MetadataTests() {
        it('Get Readable Modules', async function GetReadableModules() {
            const instance = new SugarCrm(cfg, this);
            const modules = await instance.getModules(true);

            expect(modules).to.include.keys({
                Contacts: 'Contacts',
                Audit: 'Audit'
            });
            expect(modules).to.not.have.any.keys('_hash', 'MergeRecords');
        });

        it('Get Writable Modules', async function GetWritableModules() {
            const instance = new SugarCrm(cfg, this);
            const modules = await instance.getModules(false);

            expect(modules).to.include.keys({
                Contacts: 'Contacts'
            });
            expect(modules).to.not.have.any.keys('_hash', 'MergeRecords', 'Audit');
        });

        it('Build in schema', async function BuildInSchemaTest() {
            cfg.module = 'Contacts';
            const schema = await upsertObject.getMetaModel(cfg);

            expect(schema.in.properties.last_name.required).to.be.true;
            expect(schema.in.properties.date_modified).to.not.exist;
            expect(schema.in.properties.name).to.not.exist;
            expect(schema.in.properties._hash).to.not.exist;
            expect(schema.in.properties.salutation.enum).to.include.members(['Mr.']);
            expect(schema.in.properties.email1).to.exist;
            expect(schema.in.properties.reports_to_link).to.not.exist;
            expect(schema.in.properties.calls).to.not.exist;

            expect(schema.in.properties.id.required).to.be.false;
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
        });
    });

    describe('Verify Credentials Tests', function VerifyCredentialsTests() {
        it('Correct Password', async function CorrectPasswordTest() {
            const cb = sinon.spy();
            await verifyCredentials.call({logger: Logger.getLogger()}, cfg, cb);
            expect(cb.getCall(0).args[1].verified).to.be.true;
        });

        it('Incorrect Password', async function IncorrectPasswordTest() {
            const cb = sinon.spy();
            const wrongCfg = JSON.parse(JSON.stringify(cfg));
            wrongCfg.password = 'WrongPassword';
            const authResult = await verifyCredentials.call({logger: Logger.getLogger()}, wrongCfg, cb);
            expect(cb.getCall(0).args[1].verified).to.be.false;
        });
    });

    describe('Action Tests', function ActionTests() {
        it('Create Contact, Then Update and then Delete', async function CreateUpdateDeleteContact() {
            const emitter = new TestEmitter();
            const msg = {
                body: {
                    first_name: 'CreateIntegration',
                    last_name: 'TestContact',
                    description: `Created at ${(new Date()).toISOString()} through automated integration tests`
                }
            };
            cfg.module = 'Contacts';

            await upsertObject.process.call(emitter, msg, cfg);

            const newEntry = emitter.data[0].body;
            const originalId = newEntry.id;
            expect(originalId).to.exist;

            newEntry.description = `${newEntry.description}\nUpdated at ${(new Date()).toISOString()}`;

            await upsertObject.process.call(emitter, {
                body: newEntry
            }, cfg);
            const updatedEntry = emitter.data[1].body;

            expect(updatedEntry.id).to.exist;
            expect(updatedEntry.id).to.be.equal(originalId);

            await deleteObject.process.call(emitter, {
                body: updatedEntry
            }, cfg);

            expect(emitter.data.length).to.equal(3);
            expect(emitter.data[2].body.id).to.be.equal(originalId);
        });

        it('Lookup test', async function LookupTest() {
            const idToLookup = process.env.CONTACT_ID;
            const emitter = new TestEmitter();
            const msg = {
                body: {
                    id: idToLookup
                }
            };
            cfg.module = 'Contacts';

            await lookupObject.process.call(emitter, msg, cfg);

            expect(emitter.data.length).to.equal(1);
            expect(emitter.data[0].body.name).to.be.equal('Dennis Shaw');
        });

    });
});

