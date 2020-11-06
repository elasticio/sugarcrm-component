process.env.OAUTH_CLIENT_ID = 'asd';
process.env.OAUTH_CLIENT_SECRET = 'sdc';
const logger = require('@elastic.io/component-logger')();

require('elasticio-rest-node');

const EXT_FILE_STORAGE = 'http://file.storage.server/file';

require.cache[require.resolve('elasticio-rest-node')] = {
  exports: () => ({
    resources: {
      storage: {
        createSignedUrl: () => ({
          get_url: EXT_FILE_STORAGE,
          put_url: EXT_FILE_STORAGE,
        }),
      },
    },
  }),
};


module.exports = {
  configuration: {
    _account: '1234567890abcdef',
    password: '_secret_password',
    userName: '_not_secret_login',
    clientID: 'app_key',
    clientSecret: 'app_secret',
    platform: 'base',
    baseUrl: 'magicsoft.sugaropencloud.eu',
    oauth: {
      access_token: '12345678-1234-5678-1234-123456789acc',
      expires_in: 3600,
      token_type: 'bearer',
      scope: null,
      refresh_token: '12345678-1234-5678-1234-123456789eef',
      refresh_expires_in: 1209600,
      download_token: '12345678-1234-5678-1234-123456789aad',
      access_token_expiry: '2019-12-03T13:44:30.321Z',
      refresh_token_expiry: '2019-12-17T12:44:30.321Z',
    },
  },
  refresh_token: {
    url: 'https://magicsoft.sugaropencloud.eu/rest/v10/oauth2/token',
    path: '/oauth2/token',
    response: {
      access_token: 'the unthinkable top secret access token',
      refresh_token: 'the not less important also unthinkable top secret refresh token',
      expires_in: 3600,
      refresh_expires_in: 1209600,
    },
  },
  emit: function emit(what, message) {
    if (typeof what === 'string' && what.toLowerCase().includes('error')) {
      throw message;
    }

    if (typeof (this.emitCallback) === 'function') {
      this.emitCallback(what, message);
    }
  },
  logger,
  emitCallback: null,
  EXT_FILE_STORAGE,
  TEST_INSTANCE_URL: 'https://magicsoft.sugaropencloud.eu/rest/v10',
};
