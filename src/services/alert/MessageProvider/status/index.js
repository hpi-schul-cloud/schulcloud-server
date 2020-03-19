const commons = require('@schul-cloud/commons');
const api = require('../../../../helper/externalApiRequest');
const logger = require('../../../../../src/logger');

const { Configuration } = commons;

const apiUri = Configuration.get('ALERT_STATUS_API_URL');

const dict = {
	default: 1,
	brb: 2,
	open: 3,
	n21: 6,
	thr: 7,
};

/**
 * Check if Message is instance specific
 * @param {string} instance
 * @param {number} componentId
 * @returns {Promise}
 */
async function isInstance(instance, componentId) {
	if (componentId !== 0) {
		try {
			const response = await api(apiUri).get(`/components/${componentId}`);
			if (dict[instance] && response.data.group_id === dict[instance]) {
				return true;
			}
			return false;
		} catch (error) {
			return false;
		}
	} else {
		return true;
	}
}

/**
 * Get all incidents
 * @returns {Promise}
 */
async function getRawData() {
	const response = await api(apiUri).get('/incidents');
	return response;
}

module.exports = {
	async getData(instance) {
		const data = [];
		if (apiUri !== undefined) {
			try {
				const rawData = await getRawData();
				for (const element of rawData.data) {
					// only mind incidents not older than 2 days
					if (Date.parse(element.updated_at) + 1000 * 60 * 60 * 24 * 2 >= Date.now()) {
						// only mind messages for own instance (including none instance specific messages)
						const isinstance = await isInstance(instance, element.component_id);
						if (isinstance) {
							data.push(element);
						}
					}
				}
				return data;
			} catch (e) { // return null on error
				return null;
			}
		} else {
			logger.warning('Alert-MessageProvider: status: STATUS_API_URL is not defined!');
			return null;
		}
	},
};
