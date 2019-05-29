const nodemailer = require('nodemailer');
const logger = require('winston');

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
		create({
			headers,
			email,
			subject,
			content,
		}, params) {
			return checkForToken(params, app)
				.then(async (user) => {
					const options = app.get('secrets').smtp || app.get('secrets').sendmail || {};
					const transporter = nodemailer.createTransport(options);
					const mail = {
						from: process.env.SMTP_SENDER || 'noreply@schul-cloud.org',
						headers,
						to: user ? user.email : email,
						subject,
						html: content.html,
						text: content.text,
					};
					// send mail with defined transport object in production mode
					if (process.env.NODE_ENV === 'production') {
						const info = await transporter.sendMail(mail);
						return logger.info('E-Mail Message sent: %s', info.messageId);
					}
					// otherwise print email message object on console
					return logger.debug('E-Mail Message not sent (not in production mode):', mail);
				}).catch(err => Promise.reject(err));
		}
	}

	return MailService;
};
