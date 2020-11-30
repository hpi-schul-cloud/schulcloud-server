const { Configuration } = require('@hpi-schul-cloud/commons');
const Api = require('./apiHelper');

const statusApi = () => {
	const api = new Api({
		baseURL: Configuration.get('ALERT_STATUS_API_URL'),
	});

	const getIncidents = (sort = 'id') => {
		return api.get('/incidents', { params: { sort } }).then((response) => response.data);
	};

	const getComponent = (componentId) => {
		return api.get(`/components/${componentId}`).then((response) => response.data);
	};

	return {
		getIncidents,
		getComponent,
	};
};

module.exports = statusApi();
