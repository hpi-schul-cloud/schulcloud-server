const logger = require('../../../../logger');
const { statusApi } = require('../../../../externalServices');

const dict = {
	default: 1,
	brb: 2,
	open: 3,
	n21: 6,
	thr: 7,
};

const importance = {
	INGORE: -1,
	ALL_INSTANCES: 0,
	CURRENT_INSTANCE: 1,
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
			const response = await statusApi.getComponent(componentId);
			if (dict[instance] && response.data.group_id === dict[instance]) {
				return importance.CURRENT_INSTANCE;
			}
			return importance.INGORE;
		} catch (error) {
			return importance.INGORE;
		}
	} else {
		return importance.ALL_INSTANCES;
	}
}

function compare(a, b) {
	const dateA = new Date(a.updated_at);
	const dateB = new Date(b.updated_at);
	const createdAtA = new Date(a.createdAt);
	const createdAtB = new Date(b.createdAt);

	// sort by status; danger first
	if (a.status > b.status) return 1;
	if (b.status > a.status) return -1;
	// sort by newest
	if (dateA > dateB) return -1;
	if (dateB > dateA) return 1;
	if (createdAtA > createdAtB) return -1;
	if (createdAtB > createdAtA) return 1;

	return 0;
}

module.exports = {
	async getData(instance) {
		try {
			const rawData = await statusApi.getIncidents();
			const instanceSpecific = [];
			const noneSpecific = [];
			const statusEnum = { fixed: 4, danger: 2 };

			const filteredData = rawData.data.filter((element) => element.status !== statusEnum.fixed);
			const promises = filteredData.map(async (element) => {
				const isinstance = await getInstance(instance, element.component_id);
				if (isinstance !== importance.ALL_INSTANCES && isinstance !== importance.INGORE) {
					instanceSpecific.push(element);
				} else if (isinstance !== importance.INGORE) {
					noneSpecific.push(element);
				}
			});

			await Promise.all(promises);

			// do some sorting
			instanceSpecific.sort(compare);
			noneSpecific.sort(compare);

			return instanceSpecific.concat(noneSpecific);
		} catch (err) {
			// return null on error
			logger.error(err);
			return null;
		}
	},
};
