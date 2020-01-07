const request = require('request-promise-native');
const logger = require('../../logger');

const { REQUEST_TIMEOUT } = require('../../../config/globals');

const checkForToken = (params, app) => {
	if ((params.headers || {}).token) {
		const userId = params.headers.token;
		return app.service('/users/').get(userId);
	}

	return Promise.resolve(false);
};

module.exports = function setup(app) {
	class MailService {
		// POST
		async create(data, params) {
			const serviceUrls = app.get('services') || {};

			const user = await checkForToken(params, app);

			const {
				headers,
				email,
				replyEmail,
				subject,
				content,
				// TODO: must be implemented by the mailservice
				// currently only used by the helpdesk
				// attachments,
			} = data;

			const Mail = {
				to: user ? user.email : email,
				subject,
				text: content.text,
				html: content.html,
				from: process.env.SMTP_SENDER || replyEmail || 'noreply@schul-cloud.org',
				replyTo: replyEmail || process.env.SMTP_SENDER || 'noreply@schul-cloud.org',
			};

			const requestOptions = {
				uri: `${serviceUrls.notification}/mails`,
				method: 'POST',
				headers: {
					...headers,
				},
				body: {
					platformId: 'testplatform',
					platform: 'testplatform',
					...Mail,
				},
				json: true,
				timeout: REQUEST_TIMEOUT,
			};

			// send mail with defined transport object in production mode
			if (process.env.NODE_ENV === 'production' || process.env.FORCE_SEND_EMAIL) {
				return request(requestOptions);
			}
			// otherwise print email message object on console
			return logger.debug('E-Mail Message not sent (not in production mode):', Mail);
		}
	}

	return MailService;
};
