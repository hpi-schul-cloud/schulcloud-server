const apiMetrics = require('prometheus-api-metrics');
const { Configuration } = require('@hpi-schul-cloud/commons');

module.exports = (app) => {
	if (Configuration.has('FEATURE_PROMETHEUS_ENABLED') && Configuration.get('FEATURE_PROMETHEUS_ENABLED') === true) {
		const metricsOptions = {};
		if (Configuration.has('PROMETHEUS__METRICS_PATH')) {
			metricsOptions.metricsPath = Configuration.get('PROMETHEUS__METRICS_PATH');
		}
		if (Configuration.has('PROMETHEUS__DURATION_BUCKETS_SECONDS[0]')) {
			// TODO rewrite configuration to support arrays via get()
			metricsOptions.durationBuckets = Configuration.data.PROMETHEUS.DURATION_BUCKETS_SECONDS;
		}
		app.use(apiMetrics(metricsOptions));
	}
};
