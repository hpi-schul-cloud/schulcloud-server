const { Configuration } = require('@schul-cloud/commons');
const api = require('../../../../helper/externalApiRequest');
const logger = require('../../../../logger');

const apiUri = Configuration.get('ALERT_STATUS_API_URL');
const pageUri = Configuration.get('ALERT_STATUS_URL');

const dict = {
	default: 1,
	brb: 2,
	open: 3,
	n21: 6,
	thr: 7,
};

const important = {
	no: -1,
	all: 0,
	yes: 1,
};
/**
 * Check if Message is instance specific
 * @param {string} instance
 * @param {number} componentId
 * @returns {number}
 */
async function getInstance(instance, componentId) {
	if (componentId !== 0) {
		try {
			const response = await api(apiUri).get(`/components/${componentId}`);
			if (dict[instance] && response.data.group_id === dict[instance]) {
				return important.yes;
			}
			return important.no;
		} catch (error) {
			return important.no;
		}
	} else {
		return important.all;
	}
}

/**
 * Get all incidents
 * @returns {Promise}
 */
async function getIncidents() {
	const response = await api(apiUri).get('/incidents?sort=id');
	return response;
}

function compare(a, b) {
	const dateA = new Date(a.updated_at);
	const dateB = new Date(b.updated_at);

	// sort by status; danger first
	if (a.status > b.status) return 1;
	if (b.status > a.status) return -1;
	// sort by newest
	if (dateA > dateB) return -1;
	if (dateB > dateA) return 1;

	return 0;
}

module.exports = {
	async getData(instance) {
		if (apiUri && pageUri) {
			try {
				const rawData = await getIncidents();
				const instanceSpecific = [];
				const noneSpecific = [];
				for (const element of rawData.data) {
					// only mind incidents not older than 2 days
					if (Date.parse(element.updated_at) + 1000 * 60 * 60 * 24 * 2 >= Date.now()) {
						// only mind messages for own instance (including none instance specific messages)
						const isinstance = await getInstance(instance, element.component_id);
						if (isinstance !== important.all && isinstance !== important.no) {
							instanceSpecific.push(element);
						} else if (isinstance !== important.no) {
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
