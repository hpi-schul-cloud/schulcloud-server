const dotenv = require('dotenv').config({ path: `${__dirname}/.env` });
const request = require('request-promise-native');

const dict = {
	default: 1,
	brb: 2,
	open: 3,
};

/**
 * Check if Message is instance specific
 * @param {string} instance
 * @param {number} componentId
 * @returns {Promise}
 */
function isInstance(instance, componentId) {
	return new Promise((resolve, reject) => {
		// componentId 0: message not instance specific
		if (componentId !== 0) {
			request.get(`${process.env.API_URL}/components/${componentId}`, (err, response, body) => {
				if (!err && response.statusCode === 200) {
					const data = JSON.parse(body);
					// translate instance into group_id
					if (dict[instance] && data.data.group_id === dict[instance]) {
						resolve(true);
					} else {
						resolve(false);
					}
				} else {
					reject(err);
				}
			});
		} else {
			resolve(true);
		}
	});
}

/**
 * Get all incidents
 * @returns {Promise}
 */
// TODO: only return incidents not older than 2 days
function getRawData() {
	return new Promise((resolve, reject) => {
		request.get(`${process.env.API_URL}/incidents`, (err, response, body) => {
			if (!err && response.statusCode === 200) {
				resolve(JSON.parse(body));
			} else {
				reject(err);
			}
		});
	});
}

module.exports = {
	async getData(instance) {
		const data = [];
		try {
			const rawData = await getRawData();
			for (const element of rawData.data) {
				const isinstance = await isInstance(instance, element.component_id);
				// only mind messages for own instance (including none instance specific messages)
				if (isinstance) {
					data.push(element);
				}
			}
			return data;
		} catch (e) {
			return [];
		}
	},
};
