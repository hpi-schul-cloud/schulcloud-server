const request = require('request-promise-native');
const { Configuration } = require('@hpi-schul-cloud/commons');

const { GeneralError } = require('../../errors');
const logger = require('../../logger');

const { SMTP_SENDER, NODE_ENV, ENVIRONMENTS } = require('../../../config/globals');

const checkForToken = (params, app) => {
	if ((params.headers || {}).token) {
		const userId = params.headers.token;
		return app.service('/users/').get(userId);
	}

	return Promise.resolve(false);
};

module.exports = function setup(app) {
	class MailService {
		encodeFiles(files = []) {
			return files.map(({ content, filename }) => ({
				filename,
				content: content.toString('base64'),
			}));
		}

		// POST
		async create(data, params) {
			const FORCE_SEND_EMAIL = Configuration.get('FORCE_SEND_EMAIL');
			const notificationPlatform = Configuration.get('NOTIFICATION_PLATFORM');

			if (!notificationPlatform) {
				logger.warning('Required Env NOTIFICATION_PLATFORM is not defined');
			}

			const notificationUri = Configuration.get('NOTIFICATION_URI');

			const user = await checkForToken(params, app);

			const {
				headers,
				email,
				replyEmail,
				subject,
				content,
				// TODO: must be implemented by the mailservice
				// currently only used by the helpdesk
				attachments,
			} = data;

			const base64Attachments = this.encodeFiles(attachments);

			const Mail = {
				to: user ? user.email : email,
				subject,
				text: content.text,
				html: content.html,
				from: SMTP_SENDER,
				replyTo: replyEmail,
				attachments: base64Attachments,
			};

			const requestOptions = {
				uri: `${notificationUri}/mails`,
				method: 'POST',
				headers: {
					...headers,
				},
				body: {
					platformId: notificationPlatform,
					platform: notificationPlatform,
					...Mail,
				},
				json: true,
				timeout: Configuration.get('REQUEST_TIMEOUT'),
			};

			// send mail with defined transport object in production mode
			if (NODE_ENV === ENVIRONMENTS.PRODUCTION || FORCE_SEND_EMAIL) {
				return request(requestOptions).catch((error) => {
					throw new GeneralError(error.message);
				});
			}
			// otherwise print email message object on console
			return logger.debug('E-Mail Message not sent (not in production mode):', Mail);
		}
	}

	return MailService;
};
