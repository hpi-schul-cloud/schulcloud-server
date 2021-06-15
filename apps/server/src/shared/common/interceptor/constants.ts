import config = require('@hpi-schul-cloud/commons');

const { Configuration } = config;

export const REQUEST_TIMEOUT = Configuration.get('REQUEST_TIMEOUT') as number;
