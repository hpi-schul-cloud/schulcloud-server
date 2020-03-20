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
				return response.data.group_id;
			}
			return -1;
		} catch (error) {
			return -1;
		}
	} else {
		return 0;
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

function compare(a, b) {
	const dateA = new Date(a.updated_at);
	const dateB = new Date(b.updated_at);

	if (a.status > b.status) return 1;
	if (b.status > a.status) return -1;
	if (dateA > dateB) return -1;
	if (dateB > dateA) return 1;

	return 0;
}

module.exports = {
	async getData(instance) {
		if (apiUri !== undefined) {
			try {
				const rawData = await getRawData();
				const instanceSpecific = [];
				const noneSpecific = [];
				for (const element of rawData.data) {
					// only mind incidents not older than 2 days
					if (Date.parse(element.updated_at) + 1000 * 60 * 60 * 24 * 2 >= Date.now()) {
						// only mind messages for own instance (including none instance specific messages)
						const isinstance = await isInstance(instance, element.component_id);
						if (isinstance !== 0 && isinstance !== -1) {
							instanceSpecific.push(element);
						} else if (isinstance !== -1) {
							noneSpecific.push(element);
						}
					}
				}
				// do some sorting
				instanceSpecific.sort(compare);
				noneSpecific.sort(compare);

				return instanceSpecific.concat(noneSpecific);
			} catch (e) { // return null on error
				return null;
			}
		} else {
			logger.warning('Alert-MessageProvider: status: STATUS_API_URL is not defined!');
			return null;
		}
	},
};
