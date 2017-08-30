'use strict';

const expect = require('chai').expect;
const GetEntry = require('../lib/triggers/getEntry');
const EventEmitter = require('events');

class TestEmitter extends EventEmitter {
    constructor() {
        super();
        this.data = [];
        this.error = [];
        this.snapshot = [];
        this.keys = [];

        this.on('data', (value) => this.data.push(value));
        this.on('error', (value) => {
            this.error.push(value);
            console.error(value.stack || value);
        });
        this.on('snapshot', (value) => this.snapshot.push(value));
        this.on('updateKeys', (value) => this.keys.push(value));
    }
}

describe('Get Entry Test', function getEntryTest() {
    let username;
    let password;
    let appId;
    let appSecret;
    let sugarDoman;

    this.timeout(10000);

    before(function setup() {
        if(process.env.NODE_ENV === 'local') {
            require('dotenv').config()
        }

        username = process.env.USERNAME;
        password = process.env.PASSWORD;
        appId = process.env.OAUTH_APPLICATION_ID;
        appSecret = process.env.OAUTH_APPLICATION_SECRET;
        sugarDoman = process.env.SUGAR_URL;
    });

    it('Get Entry', async function getEntry() {
        const emitter = new TestEmitter();
        const msg = {};
        const cfg = {
            newUpdatedOrAll: 'all',
            returnIndividually: 'individually',
            module: 'Contacts',
            clientID: appId,
            clientSecret: appSecret,
            userName: username,
            password: password,
            baseUrl: sugarDoman,
            maxNum: '1'
        };
        const initialSnapshot = undefined;

        await GetEntry.process.call(emitter, msg, cfg, initialSnapshot);

        expect(emitter.snapshot.length).to.equal(1);
        expect(emitter.data.length).to.equal(1);
        expect(emitter.data[0]).to.be.a('object');

        cfg.oauth = emitter.keys[0].oauth;
        delete cfg.maxNum;

        await GetEntry.process.call(emitter, msg, cfg, emitter.snapshot[0]);

        expect(emitter.data.length).to.be.above(1);
        expect(emitter.data[1]).to.be.a('object');
        expect(emitter.data[1]).to.not.deep.equal(emitter.data[0]);
    });

    it('Get Modules', async function getModules() {
        const cfg = {
            clientID: appId,
            clientSecret: appSecret,
            userName: username,
            password: password,
            baseUrl: sugarDoman
        };

        const modules = await GetEntry.modules(cfg);

        expect(modules['Contacts']).to.equal('Contacts');
    });
});
