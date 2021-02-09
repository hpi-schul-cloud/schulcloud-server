const axios = require('axios');

const { Configuration } = require('@hpi-schul-cloud/commons');
const logger = require('../../../logger');
const { GeneralError } = require('../../../errors');

class WalletService {
	setup(app) {
		this.app = app;
	}

	async create(data, params) {
		if (!Configuration.has('IDAS_API_KEY_SECRET')) {
			logger.error('IDAS API key not set');
			return null;
		}
		const apiToken = Configuration.get('IDAS_API_KEY_SECRET');

		const { userId } = params.account;

		const user = await this.app.service('users').get(userId);

		const res = await axios
			.post(
				'https://daad.idas.solutions/api/v1/RelationshipTemplates',
				{
					maxNumberOfRelationships: 1,
					expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
					content: {
						'@type': 'RelationshipTemplateContent',
						attributes: [
							{
								name: 'Thing.name',
								value: 'DAAD',
							},
							{
								name: 'Corporation.legalName',
								value: 'Deutscher Akademischer Austauschdienst e.V.',
							},
							{
								name: 'Corporation.vatID',
								value: 'DE122276332',
							},
							{
								name: 'Corporation.address',
								value:
									'{"addressName":"","type":"official","street":"Kennedyallee","houseNo":"50","zipCode":"53175","city":"Bonn","country":"Deutschland"}',
							},
							{
								name: 'Comm.phone',
								value: '+49 2288820',
							},
							{
								name: 'Comm.email',
								value: 'info@daad.de',
							},
							{
								name: 'Comm.website',
								value: 'https://www.daad.de',
							},
						],
						request: {
							create: [
								{ attribute: 'Thing.name', value: user.fullName },
								{ attribute: 'Person.givenName', value: user.firstName },
								{ attribute: 'Person.familyName', value: user.lastName },
								{ attribute: 'Comm.email', value: user.email },
							],
							authorizations: [
								{
									id: 'marketing',
									title: 'Ich interessiere mich für Neuigkeiten run um das Angebot des DAAD',
									duration: 'Bis auf Widerruf',
									default: true,
									required: false,
								},
							],
						},
						privacy: {
							text: 'Ja, ich habe die Datenschutzerklärung des DAAD gelesen und akzeptiere diese hiermit.',
							required: true,
							activeConsent: true,
							link: 'https://www.mydaad.de/de/datenschutz/',
						},
					},
				},
				{
					headers: {
						'X-API-KEY': apiToken,
					},
				}
			)
			.catch((error) => {
				logger.error(JSON.stringify(error));
				throw new GeneralError("Couldn't create new relationship template!");
			});

		const templateID = res.data.result.id;

		const qrcode = await axios
			.post(
				`https://daad.idas.solutions/api/v1/RelationshipTemplates/${templateID}/Token`,
				{},
				{
					responseType: 'arraybuffer',
					headers: {
						Accept: 'image/*',
						'X-API-KEY': apiToken,
					},
				}
			)
			.then((response) => Buffer.from(response.data, 'binary').toString('base64'))
			.catch((error) => {
				logger.error(error);
				throw new GeneralError("Couldn't create QR-Code for relationship template!");
			});

		return {
			templateID,
			qrcode,
		};
	}

	async update(id, data, params) {
		if (!Configuration.has('IDAS_API_KEY_SECRET')) {
			logger.error('IDAS API key not set');
			return null;
		}
		const apiToken = Configuration.get('IDAS_API_KEY_SECRET');

		const requests = await axios.get('https://daad.idas.solutions/api/v1/RelationshipRequests/OpenIncoming', {
			headers: {
				'X-API-KEY': apiToken,
			},
		});

		logger.info(requests.data.result);

		const { templateID } = data;
		logger.info(templateID);

		const matchingRequest = requests.data.result.find((request) => request.relationshipTemplateId === templateID);

		if (matchingRequest) {
			const requestID = matchingRequest.id;

			const relationship = await axios.put(
				`https://daad.idas.solutions/api/v1/RelationshipRequests/${requestID}/Accept`,
				{
					content: {},
				},
				{
					headers: {
						'X-API-KEY': apiToken,
					},
				}
			);

			const { userId } = params.account;

			await this.app.service('users').patch(userId, {
				relationshipId: relationship.data.result.relationshipId,
			});

			logger.info(relationship.data.result.relationshipId);

			return relationship.data.result.relationshipId;
		}

		return null;
	}
}

module.exports = WalletService;
