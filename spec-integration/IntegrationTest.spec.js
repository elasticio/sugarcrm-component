const { expect } = require('chai');
const fs = require('fs');
const logger = require('@elastic.io/component-logger')();
const getObjectsPolling = require('../lib/triggers/getObjectsPolling');
const SugarCrm = require('../lib/sugarcrm');
const TestEmitter = require('./TestEmitter');
const verifyCredentials = require('../verifyCredentials');
const getObjectsWebhook = require('../lib/triggers/getObjectsWebhook');
const getDeletedObjectsWebhook = require('../lib/triggers/getDeletedObjectsWebhook');
const lookupObject = require('../lib/actions/lookupObject');
const deleteObject = require('../lib/actions/deleteObject');
const upsertObject = require('../lib/actions/upsertObject');

describe('Integration Test', function GetEntryTest() {
  this.timeout(10000);

  if (fs.existsSync('.env')) {
    // eslint-disable-next-line global-require
    require('dotenv').config();
  }

  const username = process.env.SUGAR_USERNAME;
  const password8 = process.env.PASSWORD_8;
  const appId = process.env.OAUTH_APPLICATION_ID;
  const appSecret = process.env.OAUTH_APPLICATION_SECRET;
  const sugarDomain8 = process.env.SUGAR_8_URL;
  const platform = process.env.PLATFORM;

  const cfg = {
    clientID: appId,
    clientSecret: appSecret,
    userName: username,
    password: password8,
    baseUrl: sugarDomain8,
    platform,
  };


  describe('Webhook setup tests', () => {
    it('Webhook Startup - Shutdown', async () => {
      cfg.module = 'Contacts';
      [getObjectsWebhook, getDeletedObjectsWebhook].forEach(async (webhook) => {
        const result = await webhook.startup.call(undefined, cfg);
        await webhook.shutdown.call(undefined, cfg, result);
      });
    });
  });

  describe('Get Entry Tests', () => {
    it('Get Entry', async () => {
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

  describe('Metadata tests', () => {
    it('Get Readable Modules', async function GetReadableModules() {
      const instance = new SugarCrm(cfg, this);
      const modules = await instance.getModules(true);

      expect(modules).to.include.keys({
        Contacts: 'Contacts',
        Audit: 'Audit',
      });
      expect(modules).to.not.have.any.keys('_hash', 'MergeRecords');
    });

    it('Get Writable Modules', async function GetWritableModules() {
      const instance = new SugarCrm(cfg, this);
      const modules = await instance.getModules(false);

      expect(modules).to.include.keys({
        Contacts: 'Contacts',
      });
      expect(modules).to.not.have.any.keys('_hash', 'MergeRecords', 'Audit');
    });

    it('Build in schema, module: Contacts', async () => {
      cfg.module = 'Contacts';
      const schema = await upsertObject.getMetaModel(cfg);

      expect(schema.in.properties.last_name.required).to.equal(true);
      expect(schema.in.properties).to.have.own.property('email1');
      expect(schema.in.properties).to.have.own.property('email2');
      expect(schema.in.properties).to.not.have.own.property('date_modified');
      expect(schema.in.properties).to.not.have.own.property('name');
      expect(schema.in.properties).to.not.have.own.property('_hash');
      expect(schema.in.properties.salutation.enum).to.include.members(['Mr.']);

      expect(schema.in.properties.id.required).to.equal(false);
    });

    it('Build in schema, module: Accounts', async () => {
      cfg.module = 'Accounts';
      const schema = await upsertObject.getMetaModel(cfg);

      expect(schema.in.properties).to.not.have.own.property('email1');
      expect(schema.in.properties).to.not.have.own.property('email2');
    });

    it('Build out schema', async () => {
      cfg.module = 'Contacts';
      const schema = await getObjectsWebhook.getMetaModel(cfg);

      expect(schema.out.properties.id.required).to.equal(true);
      expect(schema.out.properties).to.haveOwnProperty('date_modified');
    });
  });

  describe('Token Exchange tests', () => {
    it('Token tests', async () => {
      // First test password -> token exchange
      const emitter = new TestEmitter();
      const instance1 = new SugarCrm(cfg, emitter);

      await instance1.makeRequest('ping', 'GET');

      expect(emitter.keys.length).to.equal(1);
      const accessToken1 = emitter.keys[0].oauth.access_token;
      expect(accessToken1).to.not.equal(undefined);
    });
  });

  describe('Verify Credentials Tests', () => {
    it('Correct Password', async () => {
      const authResult = await verifyCredentials.call({ logger }, cfg);
      expect(authResult).to.equal(true);
    });

    it('Incorrect Password', async () => {
      const wrongCfg = JSON.parse(JSON.stringify(cfg));
      wrongCfg.password = 'WrongPassword';
      const authResult = await verifyCredentials.call({}, wrongCfg);
      expect(authResult).to.equal(false);
    });
  });

  describe('Action Tests', () => {
    it('Create Contact, Then Update and then Delete', async () => {
      const emitter = new TestEmitter();
      const msg = {
        body: {
          first_name: 'CreateIntegration',
          last_name: 'TestContact',
          description: `Created at ${(new Date()).toISOString()} through automated integration tests`,
        },
      };
      cfg.module = 'Contacts';

      await upsertObject.process.call(emitter, msg, cfg);

      const newEntry = emitter.data[0].body;
      const originalId = newEntry.id;
      expect(originalId).to.not.equal(undefined);

      newEntry.description = `${newEntry.description}\nUpdated at ${(new Date()).toISOString()}`;

      await upsertObject.process.call(emitter, {
        body: newEntry,
      }, cfg);
      const updatedEntry = emitter.data[1].body;

      expect(updatedEntry.id).to.not.equal(undefined);
      expect(updatedEntry.id).to.be.equal(originalId);

      await deleteObject.process.call(emitter, {
        body: updatedEntry,
      }, cfg);

      expect(emitter.data.length).to.equal(3);
      expect(emitter.data[2].body.id).to.be.equal(originalId);
    });

    it('Lookup test', async () => {
      const idToLookup = process.env.CONTACT_ID_8;
      const emitter = new TestEmitter();
      const msg = {
        body: {
          id: idToLookup,
        },
      };
      cfg.module = 'Contacts';

      await lookupObject.process.call(emitter, msg, cfg);

      expect(emitter.data.length).to.equal(1);
      expect(emitter.data[0].body.name).to.be.equal('Fred Jones');
    });
  });
});
