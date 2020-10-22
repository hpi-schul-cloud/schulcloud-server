const { Configuration } = require('@schul-cloud/commons');
const Api = require('../../../helper/apiWrapper');

class StatusApi extends Api {
	constructor() {
		super({ baseURL: Configuration.get('ALERT_STATUS_API_URL') });
	}

	getIncidents(sort = 'id') {
		return this.get('/incidents', { params: { sort } });
	}

	getComponent(componentId) {
		return this.get(`/components/${componentId}`);
	}
}

const api = new StatusApi();

module.exports = api;
