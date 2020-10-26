const { Configuration } = require('@schul-cloud/commons');
const Api = require('../../../../helper/apiHelper');

class StatusApi extends Api {
	constructor() {
		super({ baseURL: Configuration.get('ALERT_STATUS_API_URL') });
	}

	/**
	 * Transform responses to return json data only
	 * @param {T} data
	 */
	transformResponse(response) {
		return response.data;
	}

	getIncidents(sort = 'id') {
		return this.get('/incidents', { params: { sort } });
	}

	getComponent(componentId) {
		return this.get(`/components/${componentId}`);
	}
}

module.exports = new StatusApi();
