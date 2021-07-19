const { Configuration } = require('@hpi-schul-cloud/commons');

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
			return files.map(({ content, filename, mimetype }) => ({
				mimeType: mimetype,
				name: filename,
				base64Content: content.toString('base64'),
				contentDisposition: 'ATTACHMENT',
			}));
		}

		// POST
		async create(data, params) {
			const FORCE_SEND_EMAIL = Configuration.get('FORCE_SEND_EMAIL');

			const user = await checkForToken(params, app);

			const { email, replyEmail, subject, content, attachments } = data;

			const base64Attachments = this.encodeFiles(attachments);

			const mailContent = {
				mail: {
					subject,
					htmlContent: content.html,
					plainTextContent: content.text,
					attachments: base64Attachments,
				},
				recipients: [user ? user.email : email],
				from: SMTP_SENDER,
				replyTo: replyEmail ? [replyEmail] : null,
			};

			// send mail with defined transport object in production mode
			if (NODE_ENV === ENVIRONMENTS.PRODUCTION || FORCE_SEND_EMAIL) {
				const mailService = app.service('/nest-mail');
				mailService.send(mailContent);
			}
			// otherwise print email message object on console
			return logger.debug('E-Mail Message not sent (not in production mode):', mailContent);
		}
	}

	return MailService;
};
