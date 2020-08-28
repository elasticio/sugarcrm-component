'use strict';

const EventEmitter = require('events');
const { Logger } = require('@elastic.io/component-commons-library');

module.exports = class TestEmitter extends EventEmitter {
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
        this.logger = Logger.getLogger();
    }
};
