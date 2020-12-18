/* eslint-disable global-require */
import { Configuration } from '@hpi-schul-cloud/commons';
import { warning } from '../../../src/logger';

const FEATURE_VIDEOCONFERENCE_ENABLED = Configuration.get('FEATURE_VIDEOCONFERENCE_ENABLED');

if (FEATURE_VIDEOCONFERENCE_ENABLED === true) {
	require('./index');
	require('./logic/index');
} else {
	warning('do not execute bbb tests, due FEATURE_VIDEOCONFERENCE_ENABLED has not been enabled');
}
