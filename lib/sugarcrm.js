var API_URI = 'rest/v10';

var path = require('path');
var request = require('request');
var Q = require('q');
var _ = require('underscore');
var crypt = require('./crypt');
var urlParser = require('url');

module.exports = Service;

/**
 * Return configured API caller instance
 * @param config
 * @returns {{auth: Function, getList: Function, createOrUpdate: Function, getConfig: Function, getHash: getHash}}
 * @constructor
 */
function Service (config) {
    if (!config || !config.baseUrl) {
        throw new Error('bad configuration passed');
    }
    var cfg = {
        protocol: 'https:',
        baseUrl: '',
        userName: '',
        password: '',
        clientID: ''
    };
    config.clientID = config.clientID || 'sugar';

    var url = urlParser.parse(config.baseUrl);

    if (url.protocol) {
        config.protocol = url.protocol;
    }

    if (url.hostname) {
        config.baseUrl = url.hostname + url.pathname;
    } else {
        config.baseUrl = url.pathname;
    }

    cfg = _.extend(cfg, config);
    var tokenData = {};

    /**
     * Base caller function
     * @param url
     * @param method (GET || POST || PUT)
     * @param body for POST/PUT requests
     * @param headers custom HTTP headers
     * @returns {Promise}
     */
    function makeRequest (url, method, body, headers) {
        var fullUrl = cfg.protocol + '//' + path.join(cfg.baseUrl, API_URI, url);
        var parameters = {
            url: fullUrl,
            method: method,
            json: true,
            body: body,
            headers: headers ? headers : undefined
        };

        console.log('About to make request with params: %j', parameters);

        var defer = Q.defer();
        function onResponse (error, response) {
            if (error || response.statusCode !== 200) {
                if (!error) {
                    var error = new Error(
                        'bad response from provider: ' + JSON.stringify(response.body)
                    );
                    error.statusCode = response.statusCode ? response.statusCode : 500;
                }
                return defer.reject(error);
            }
            defer.resolve(response.body);
        }
        request(
            parameters,
            onResponse
        );
        return defer.promise;
    }

    return {
        /**
         * make auth request, populate token data in instance property
         * @returns {Promise}
         */
        auth: function () {
            function populateAuthData (data) {
                tokenData = data;
                //setTimeout(refreshToken, 3000 * 1000); // 3000 seconds
            }
            function refreshToken () {
                var refreshParameters = {
                    'grant_type': 'refresh_token',
                    'client_id': cfg.clientID,
                    'refresh_token': tokenData.refresh_token
                };
                makeRequest(
                    '/oauth2/token',
                    'POST',
                    refreshParameters
                )
                    .then(populateAuthData);
            }
            var createParameters = {
                'grant_type': 'password',
                'client_id': cfg.clientID,
                'client_secret': cfg.clientSecret,
                'username': cfg.userName,
                'password': cfg.password,
                'platform': 'base'
            };
            return makeRequest(
                '/oauth2/token',
                'POST',
                createParameters
            )
                .then(populateAuthData);
        },
        getQuery: function (module, query, snapshot, emitter) {
            var defer = Q.defer();
            var results = [];
            var offset = 0;
            function bySnapshot(entry) {
                return typeof (snapshot[entry.id]) === 'undefined'
                    || snapshot[entry.id] !== getHash(entry);
            }
            function getListPart () {
                function onResponse (data) {
                    if (emitter) {
                        emitter.emit('heartbeat');
                    }
                    offset = data.next_offset;
                    results = results.concat(data.records);
                    if (data.next_offset !== -1) {
                        return getListPart();
                    }
                    defer.resolve(results.filter(bySnapshot));
                }
                makeRequest(
                    module + '/filter',
                    'POST',
                    Object.assign({offset: offset}, query),
                    {'oauth-token': tokenData.access_token}
                )
                    .then(onResponse, defer.reject);
            }

            getListPart();

            return defer.promise;
        },
        /**
         * make several GET requests for specified module
         * based on next_offset response and return combined array of items
         * @param type - module name
         * @param since - fetch all results since
         * @returns {Promise}
         */
        getList: async function (type, since) {
            return await makeRequest(
                `${type}/filter`,
                'POST',
                {
                    filter: [
                        {
                            "date_modified": {
                                "$gt": since
                            }
                        }
                    ],
                    order_by: "date_modified:ASC"
                },
                {'oauth-token': tokenData.access_token}
            );
        },
        /**
         * @param type - module name
         * @param data - module entry data
         * @param id - entry id for update handler
         * @returns {Promise}
         */
        createOrUpdate: function (type, data, id) {
            id = id || '';
            var method = id ? 'PUT' : 'POST';
            return makeRequest(
                path.join(type, id),
                method,
                data,
                {'oauth-token': tokenData.access_token}
            );
        },

        /**
         * Returns instance config object
         * @returns {{protocol: string, baseUrl: string, userName: string, password: string, clientID: string}}
         */
        getConfig: function () {
            return cfg;
        },
        /**
         * Calculates object hash
         * @param entry
         * @returns {String}
         */
        getHash: crypt.getHash
    };
}
