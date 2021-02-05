const axios = require('axios');
const FormData = require('form-data');
const logger = require('../../../logger');

const { Configuration } = require('@hpi-schul-cloud/commons');
class WalletFileService {
	setup(app) {
		this.app = app;
	}

	async create(data, params) {

		if(!Configuration.has('IDAS_API_KEY_SECRET')){
			logger.error('IDAS API key not set');
			return 'IDAS API key not set';
		}
		const apiToken = Configuration.get('IDAS_API_KEY_SECRET');

		const form = new FormData();
		form.append('file', params.file.buffer, {
			filename: params.file.originalname,
			contentType: params.file.mimetype,
		});
		form.append('title', data.title);
		form.append('expiresAt', new Date(Date.now() + 1000 * 60 * 60).toISOString());
		form.append('description', data.description);

		try {
			const file = await axios
				.post('https://daad.idas.solutions/api/v1/Files', form, {
					headers: {
						...form.getHeaders(),
						'X-API-KEY': apiToken,
					},
				})
				.catch((error) => {
					logger.error(error.response);
				});

			logger.info(file.data.result);

			const fileID = file.data.result.id;

			const userId = data.userId || params.account.userId;
			const user = await this.app.service('users').get(userId);

			const { relationshipId } = user;
			logger.info(`RelationshipID: ${relationshipId}`);
			const relationship = await axios.get(`https://daad.idas.solutions/api/v1/Relationships/${relationshipId}`, {
				headers: {
					'X-API-KEY': apiToken,
				},
			});

			logger.info(relationship.data.result);

			const recipientID = relationship.data.result.from;

			const message = await axios.post(
				'https://daad.idas.solutions/api/v1/Messages',
				{
					recipients: [recipientID],
					content: {
						// Only dummy data, should be real data if used in production
						'@type': 'Attribute',
						name: 'dc.languageAssessmentDe',
						value: '{"value":"B1","source":"DAAD"}',
					},
					attachments: [fileID],
				},
				{
					headers: {
						'X-API-KEY': apiToken,
					},
				}
			);

			logger.info(message.data.result);

			return message.data.result;
		} catch (error) {
			logger.error(error);
			return null;
		}
	}
}

module.exports = WalletFileService;
