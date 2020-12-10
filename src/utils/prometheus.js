const prom = require('prom-client');
const promBundle = require('express-prom-bundle');
const { Configuration } = require('@hpi-schul-cloud/commons');

const { NODE_ENV } = require('../../config/globals');

module.exports = (app) => {
	if (Configuration.has('FEATURE_PROMETHEUS_ENABLED') && Configuration.get('FEATURE_PROMETHEUS_ENABLED') === true) {
		const metricsOptions = {
			includeStatusCode: Configuration.get('PROMETHEUS__INCLUDE_STATUS_CODE'),
			includeMethod: Configuration.get('PROMETHEUS__INCLUDE_METHOD'),
			includePath: Configuration.get('PROMETHEUS__INCLUDE_PATH'),
			metricType: Configuration.get('PROMETHEUS__METRIC_TYPE'),
		};
		if (Configuration.get('PROMETHEUS__COLLECT_DEFAULT_METRICS') === true) {
			metricsOptions.promClient = {
				collectDefaultMetrics: {},
			};
		}
		if (NODE_ENV === 'test') {
			// due to hot reload which may occur during testing, we have to clear prom client metric registration within of tests
			prom.register.clear();
		}
		const originalNormalize = promBundle.normalizePath;
		promBundle.normalizePath = (req, opts) => {
			const path = originalNormalize(req, opts);
			return path ? path.replace('#val', '__id__') : path;
		};
		app.use(promBundle(metricsOptions));
	}
};
