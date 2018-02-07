var rp = require('request-promise-native');

const xapi = (app, {useCallback = false, json = true} = {}) => {
    const headers = {};
    headers['Authorization'] = app.get('xapiAuth');
	headers['X-Experience-API-Version'] = '1.0.3';

    const handler = useCallback ? request : rp;
    return handler.defaults({
        baseUrl: app.get('services').xapi,
        json,
        headers
    });
};

module.exports = xapi;
