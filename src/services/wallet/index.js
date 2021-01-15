const axios = require('axios');
const logger = require('../../logger');
const hooks = require('./hooks');

const apiToken = require('../../../config/secrets').IDAS_API_KEY;

class Service {

	setup(app) {
		this.app = app;
	}
	async find(id, params) {
		let res =  await axios.get(
			"https://daad.idas.solutions/api/v1/RelationshipTemplates",
			{
				headers : {
					"X-API-KEY": apiToken,
				}
			})
		.catch((err) => {
			logger.error('Couldnt get wallet-relationshipTemplate')
		}
		);
		return res.data;
	}
}

module.exports = function () {
	const app = this;

	app.use('wallet/', new Service());

	const me = app.service('wallet/');
	me.hooks(hooks);
};
