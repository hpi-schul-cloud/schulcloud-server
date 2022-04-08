import config = require('@hpi-schul-cloud/commons');

const { Configuration } = config;

export const INCOMING_REQUEST_TIMEOUT_API = Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number;
