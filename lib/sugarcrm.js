'use strict';

const path = require('path');
const { promisify } = require('util');
const request = promisify(require('request'));
const _ = require('underscore');
const urlParser = require('url');

const API_URI = 'rest/v10';
const platform = 'elasticio';

module.exports = Service;

/**
 * Return configured API caller instance.  This caller instance handles authentication
 * @constructor
 * @param {Object} config
 * @param {string} config.clientID - OAuth App ID
 * @param {string} config.clientSecret - OAuth App Secret
 * @param {string} config.userName - User's login info
 * @param {string} config.password - User's login info
 * @param {?Object} config.oauth
 * @param {string} config.oauth.access_token - Access token provided by SugarCRM
 * @param {Date} config.oauth.access_token_expiry - Date of access token expiry
 * @param {string} config.oauth.refresh_token - Refresh token provided by SugarCRM
 * @param {Date} config.oauth.refresh_token_expiry - Date of refresh token expiry
 * @param {Object} emitter
 * @param {function} emitter.emit
 * @returns {{makeRequest: Function}}
 * @constructor
 */
function Service (config, emitter) {
    if (!config || !config.baseUrl) {
        throw new Error('SugarCRM Configuration is missing base URL');
    }
    let cfg = {
        protocol: 'https:'
    };

    const url = urlParser.parse(config.baseUrl);

    if (url.protocol) {
        config.protocol = url.protocol;
    }

    if (url.hostname) {
        config.baseUrl = url.hostname + url.pathname;
    } else {
        config.baseUrl = url.pathname;
    }

    cfg = _.extend(cfg, config);

    const buildUrl = function buildUrl(urlPath) {
        return cfg.protocol + '//' + path.join(cfg.baseUrl, API_URI, urlPath);
    };

    const fetchAndSaveToken = async function fetchAndSaveToken(authParameters) {
        const now = new Date();

        const authTokenResponse = await request({
            url: buildUrl('/oauth2/token'),
            method: 'POST',
            json: true,
            body: authParameters
        });

        if (!wasAuthenticationSuccessful(authTokenResponse)) {
            throw new Error(`Failed to obtain new tokens: ${JSON.stringify(authTokenResponse)}`);
        }

        cfg.oauth = authTokenResponse.body;
        cfg.oauth.access_token_expiry = new Date(now.getTime() + cfg.oauth.expires_in);
        cfg.oauth.refresh_token_expiry = new Date(now.getTime() + cfg.oauth.refresh_expires_in);

        // Workaround for https://github.com/elasticio/sailor-nodejs/issues/57
        if (emitter.emit) {
            emitter.emit('updateKeys', {oauth: cfg.oauth});
        }

        console.log(`Successfully retrieved updated tokens.  Access token expires at ${cfg.oauth.access_token_expiry.toISOString()}.  Refresh token expires at ${cfg.oauth.refresh_token_expiry.toISOString()}`);

        return cfg.oauth.access_token;
    };

    const getTokenUsingUserCredentials = async function getTokenUsingUserCredentials() {
        const createParameters = {
            'grant_type': 'password',
            'client_id': cfg.clientID,
            'client_secret': cfg.clientSecret,
            'username': cfg.userName,
            'password': cfg.password,
            'platform': platform
        };

        return await fetchAndSaveToken(createParameters);
    };

    const getAccessTokenUsingRefreshToken = async function getAccessTokenUsingRefreshToken() {
        const refreshParameters = {
            'grant_type': 'refresh_token',
            'client_id': cfg.clientID,
            'client_secret': cfg.clientSecret,
            'username': cfg.userName,
            'platform': platform
        };

        return await fetchAndSaveToken(refreshParameters);
    };

    /**
     * Check the response from SugarCRM.  Returns true for 200s responses authenticated.  Returns false if there is a problem with authentication.
     * Throws an exception for all other response codes.
     * @returns {boolean}
     */
    const wasAuthenticationSuccessful = function wasAuthenticationSuccessful(sugarCrmRepsonse) {
        if(sugarCrmRepsonse.statusCode >= 200 && sugarCrmRepsonse.statusCode < 300) {
            return true;
        }

        if (sugarCrmRepsonse.statusCode === 401 && sugarCrmRepsonse.body && sugarCrmRepsonse.body.error === 'invalid_grant') {
            return false;
        }

        throw new Error(`Unexpected response from provider.  Status code: ${sugarCrmRepsonse.statusCode} Body: ${JSON.stringify(sugarCrmRepsonse.body)}`);
    };

    /**
     * @returns {string} A valid access token
     */
    const auth = async function() {
        cfg.oauth = cfg.oauth || {};
        const now = new Date();

        // Do nothing if access token should already be valid
        if (now > cfg.oauth.access_token) {
            console.log('Current access token should be valid.  Will attempt access with this token...');
            return cfg.oauth.access_token;
        }

        // If no access token, fetch access token using user credentials
        if (!cfg.oauth.access_token) {
            console.log('No access token found.  Fetching access token with user credentials...');
            return await getTokenUsingUserCredentials();
        }

        // Use refresh_token to fetch new access token.
        // If that fails, try password auth.
        console.log('The current access token has expired.');

        if (now > cfg.refresh_token_expiry) {
            console.log('The refresh token appears to be valid.  Attempting to fetch new token using refresh token...');
            return await getAccessTokenUsingRefreshToken();
        }

        console.log('The current refresh token has also expired.  Attempting to fetch tokens with password.');
        return await getTokenUsingUserCredentials();
    };

    /**
     * Base caller function
     * @param {string} url
     * @param {string} method (GET || POST || PUT)
     * @param {string} body for POST/PUT requests
     * @returns {Object} response body
     */
    this.makeRequest = async function makeRequest(url, method, body) {
        const fullUrl = cfg.protocol + '//' + path.join(cfg.baseUrl, API_URI, url);
        const accessToken = await auth();
        const parameters = {
            url: fullUrl,
            method: method,
            json: true,
            body: body,
            headers: {'oauth-token': accessToken}
        };

        console.log(`About to make request.  Url: ${parameters.url}, Method: ${method} Body: ${JSON.stringify(body)}`);

        const response = await request(parameters);

        const wasSuccessful = wasAuthenticationSuccessful(response);
        return response.body;
    };

    return this;
}