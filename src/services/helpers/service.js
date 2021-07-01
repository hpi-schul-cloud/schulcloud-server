const { Configuration } = require('@hpi-schul-cloud/commons');

const logger = require('../../logger');

const { NestAppHolder } = require('../../../dist/apps/server/legacyConnection/nestAppHolder');
const { MailAttachment, Mail } = require('../../../dist/apps/server/modules/mail/entity/mail.entity');
const { MailDisposition } = require('../../../dist/apps/server/modules/mail/constants');

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
			return files.map(({ content, filename, mimetype }) => MailAttachment.createInstance(content, mimetype, filename, MailDisposition.Attachment));
		}

		// POST
		async create(data, params) {
			const FORCE_SEND_EMAIL = Configuration.get('FORCE_SEND_EMAIL');

			const user = await checkForToken(params, app);

			const { email, replyEmail, subject, content, attachments } = data;

			const base64Attachments = this.encodeFiles(attachments);

			const mail = new Mail(
				subject,
				[user ? user.email : email],
				base64Attachments,
				content.html,
				content.text,
				SMTP_SENDER,
				null,
				null,
				[replyEmail],
			);

			// send mail with defined transport object in production mode
			if (NODE_ENV === ENVIRONMENTS.PRODUCTION || FORCE_SEND_EMAIL) {
				const nestApp = NestAppHolder.getInstance();
				const mailService = nestApp.get(MailService);
				mailService.send(mail);
			}
			// otherwise print email message object on console
			return logger.debug('E-Mail Message not sent (not in production mode):', mail);
		}
	}

	return MailService;
};
