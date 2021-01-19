const axios = require('axios');
const logger = require('../../logger');
const setHeaders = require('./hooks/setResponseHeader')
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

	async create(data, params) {
		let res = await axios.post(
			"https://daad.idas.solutions/api/v1/RelationshipTemplates",
			{
				"maxNumberOfRelationships": 1,
				"expiresAt": new Date(Date.now() + 1000*60*30).toISOString(),
				"content": {
					"@type": "RelationshipTemplateContent",
					"attributes": [
						{
							"name": "Thing.name",
							"value": "DAAD"
						},
						{
							"name": "Corporation.legalName",
							"value": "Deutscher Akademischer Austauschdienst e.V."
						},
						{
							"name": "Corporation.vatID",
							"value": "DE122276332"
						},
						{
							"name": "Corporation.address",
							"value":
								"{\"addressName\":\"\",\"type\":\"official\",\"street\":\"Kennedyallee\",\"houseNo\":\"50\",\"zipCode\":\"53175\",\"city\":\"Bonn\",\"country\":\"Deutschland\"}"
						},
						{
							"name": "Comm.phone",
							"value": "+49 2288820"
						},
						{
							"name": "Comm.email",
							"value": "info@daad.de"
						},
						{
							"name": "Comm.website",
							"value": "https://www.daad.de"
						}
					],
					"request": {
						"create": [
							{"attribute":"Thing.name", "value":"Xana Quispe"},
							{"attribute":"Person.givenName", "value":"Xana"},
							{"attribute":"Person.familyName", "value":"Quispe"},
							{"attribute":"Person.gender", "value":"f"},
							{"attribute":"Comm.email", "value":"xana.quispe@mymail.brazil"}
						],
						"authorizations": [
							{
								"id": "marketing",
								"title": "Ich interessiere mich für Neuigkeiten run um das Angebot des DAAD",
								"duration": "Bis auf Widerruf",
								"default": true,
								"required": false
							}
						]
					},
					"privacy": {
						"text": "Ja, ich habe die Datenschutzerklärung des DAAD gelesen und akzeptiere diese hiermit.",
						"required": true,
						"activeConsent": true,
						"link":"https://www.mydaad.de/de/datenschutz/"
					}
				}
			},
			{
				headers: {
					"X-API-KEY": apiToken,
				}
			}
		).catch((error) => {
			logger.error('Couldnt post wallet-relationshipTemplates')
		})

		let templateID = res.data.result.id;

		return await axios.post(
			"https://daad.idas.solutions/api/v1/RelationshipTemplates/" + templateID + '/Token', {},
			{
				responseType: 'arraybuffer',
				headers: {
					"Accept": "image/*",
					"X-API-KEY": apiToken,
				}
			}
		).then(response => Buffer.from(response.data, 'binary').toString('base64')
		).catch((error) => {
			logger.error(error);
		});
	}

	async update(id, data, params) {
		const requests = await axios.get("https://daad.idas.solutions/api/v1/RelationshipRequests/OpenIncoming", {
			headers: {
				"X-API-KEY": apiToken
			}
		})

		logger.info(requests.data.result);

		if (requests.data.result.length) {
			const requestID = requests.data.result[0].id;

			const relationship = await axios.put("https://daad.idas.solutions/api/v1/RelationshipRequests/" + requestID + "/Accept", {
					content: {}
				},
				{
					headers: {
						"X-API-KEY": apiToken
					}
				});

			logger.info(relationship.data.result);

			return relationship.data.result;
		}
	}
}

module.exports = function () {
	const app = this;

	app.use('wallet/', new Service());

	const me = app.service('wallet/');
	me.hooks(hooks);
};
