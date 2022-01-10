const { Configuration } = require('@hpi-schul-cloud/commons');
const Api = require('./apiHelper');

const baseURL = Configuration.get('ALERT_STATUS_URL').join('/api/v1');

const statusApi = () => {
	const api = new Api({
		baseURL,
	});
	// TODO: if possible request only related time not all
	const getIncidents = (sort = 'id') => api.get('/incidents', { params: { sort } }).then((response) => response.data);

	const getComponent = (componentId) => api.get(`/components/${componentId}`).then((response) => response.data);

	return {
		getIncidents,
		getComponent,
	};
};

module.exports = statusApi();
