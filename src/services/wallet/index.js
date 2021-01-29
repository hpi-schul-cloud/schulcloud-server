const axios = require('axios');
const FormData = require('form-data');
const logger = require('../../logger');
const hooks = require('./hooks');

const apiToken = require('../../../config/secrets').IDAS_API_KEY;

const { GeneralError } = require('../../errors')

class Service {

	setup(app) {
		this.app = app;
	}

	async create(data, params) {
		const userId = params.account.userId;

		const user = await this.app.service('users').get(userId);

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
							{"attribute":"Thing.name", "value": user.fullName},
							{"attribute":"Person.givenName", "value": user.firstName},
							{"attribute":"Person.familyName", "value": user.lastName},
							{"attribute":"Comm.email", "value": user.email}
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
			throw new GeneralError("Couldn't create new relationship template!")
		})

		let templateID = res.data.result.id;

		const qrcode =  await axios.post(
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
			throw new GeneralError("Couldn't create QR-Code for relationship template!")
		});

		return {
			templateID,
			qrcode
		}
	}

	async update(id, data, params) {
		const requests = await axios.get("https://daad.idas.solutions/api/v1/RelationshipRequests/OpenIncoming", {
			headers: {
				"X-API-KEY": apiToken
			}
		})

		logger.info(requests.data.result);

		const templateID = data.templateID;
		logger.info(templateID);

		const matchingRequest = requests.data.result.find(request => request.relationshipTemplateId === templateID);

		if (matchingRequest) {
			const requestID = matchingRequest.id;

			const relationship = await axios.put("https://daad.idas.solutions/api/v1/RelationshipRequests/" + requestID + "/Accept", {
					content: {}
				},
				{
					headers: {
						"X-API-KEY": apiToken
					}
				});

			logger.info(relationship.data.result.relationshipId);

			return relationship.data.result.relationshipId;
		} else {
			return undefined;
		}
	}
}

class WalletFileService {
	setup(app) {
		this.app = app
	}

	async create(data, params) {
		console.log(data);
		console.log(params.file);

		const form = new FormData();

		logger.info(form.getHeaders());

		return data;

		/*
		//TODO: multipart/form-data has to be used
		const file = await axios.post("https://daad.idas.solutions/api/v1/Files", data, {
			headers: {
				"X-API-KEY": apiToken,
				"Content-Type": "multipart/form-data"
			}
		})

		logger.info(file.data.result)

		const fileID = file.data.result.id;

		const userId = params.account.userId;
		const user = await this.app.service('users').get(userId);

		const relationshipId = user.relationshipId;

		const relationship = await axios.get("https://daad.idas.solutions/api/v1/Relationships/" + relationshipId, {
			headers: {
				"X-API-KEY": apiToken
			}
		})

		logger.info(relationship.data.result)

		const recipientID = relationship.data.result.from;

		const message = await axios.post("https://daad.idas.solutions/api/v1/Messages", {
			recipients: [
				recipientID
			],
			content: {
				"@type": "Attribute",
				"name": "dc.languageAssessmentDe",
				"value": "{\"value\":\"B1\",\"source\":\"DAAD\"}"
			},
			attachments: [
				fileID
			]
		}, {
			headers: {
				"X-API-KEY": apiToken
			}
		});

		logger.info(message.data.result);

		return message.data.result;

		 */
	}
}

module.exports = function () {
	const app = this;

	const multer = require("multer");
	const fileMiddleware = multer();

	app.use('/wallet', new Service());
	const walletService = app.service('/wallet');
	walletService.hooks(hooks);

	app.use('/wallet/files',
		fileMiddleware.single('file'),
		function (req, res, next) {
			console.log(req.file);
			console.log(req.body);

			req.feathers.file = req.file;

			next();
		},
		new WalletFileService());

	const walletFileService = app.service('/wallet/files');
	walletFileService.hooks(hooks);
};
