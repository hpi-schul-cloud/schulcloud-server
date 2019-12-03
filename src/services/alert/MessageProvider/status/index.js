const dotenv = require('dotenv').config({ path: `${__dirname}/.env` });
const request = require('request-promise-native');

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
function isInstance(instance, componentId) {
	return new Promise((resolve, reject) => {
		// componentId 0: message not instance specific
		if (componentId !== 0) {
			/* eslint-disable max-len */
			request.get(`${process.env.STATUS_API_URL}/components/${componentId}`, { timeout: 1500 }, (err, response, body) => {
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
function getRawData() {
	return new Promise((resolve, reject) => {
		request.get(`${process.env.STATUS_API_URL}/incidents`, { timeout: 1500 }, (err, response, body) => {
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
				// only mind incidents not older than 2 days
				if (isinstance && Date.parse(element.updated_at) + 1000 * 60 * 60 * 24 * 2 >= Date.now()) {
					data.push(element);
				}
			}
			return data;
		} catch (e) { // return null on error
			return null;
		}
	},
};
