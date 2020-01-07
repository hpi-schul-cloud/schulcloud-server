const request = require('request-promise-native');
const { GeneralError, Unavailable } = require('@feathersjs/errors');
const logger = require('../../logger');

const {
	REQUEST_TIMEOUT,
	SMTP_SENDER,
} = require('../../../config/globals');

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
			const FORCE_SEND_EMAIL = app.get('FORCE_SEND_EMAIL');
			const NOTIFICATION_PLATFORM = app.get('NOTIFICATION_PLATFORM');

			if (!NOTIFICATION_PLATFORM || process.env.NOTIFICATION_PLATFORM) {
				throw new Unavailable('Required Env NOTIFICATION_PLATFORM is not defined');
			}

			const serviceUrls = app.get('services') || {};

			const user = await checkForToken(params, app);

			const encodeFiles = (files) => files.map(({ content, filename }) => ({
				filename,
				content: content.toString('base64'),
			}));

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

			const base64Attachments = encodeFiles(attachments);

			const Mail = {
				to: user ? user.email : email,
				subject,
				text: content.text,
				html: content.html,
				from: SMTP_SENDER || replyEmail || 'noreply@schul-cloud.org',
				replyTo: replyEmail || SMTP_SENDER || 'noreply@schul-cloud.org',
				attachments: base64Attachments,
			};

			const requestOptions = {
				uri: `${serviceUrls.notification}/mails`,
				method: 'POST',
				headers: {
					...headers,
				},
				body: {
					platformId: NOTIFICATION_PLATFORM,
					platform: NOTIFICATION_PLATFORM,
					...Mail,
				},
				json: true,
				timeout: REQUEST_TIMEOUT,
			};

			// send mail with defined transport object in production mode
			if (app.get('env') === 'production' || FORCE_SEND_EMAIL) {
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
