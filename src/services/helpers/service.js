const promisify = require("es6-promisify");
const nodemailer = require('nodemailer');

const checkForToken = (params, app) => {
	if ((params.headers || {}).token) {
		const userId = params.headers.token;
		return app.service('/users/').get(userId);
	}

	return Promise.resolve(false);
};

module.exports = function (app) {

	class MailService {
		constructor() {

		}

		// POST
		create({headers, email, subject, content}, params) {
			return checkForToken(params, app)
				.then(user => {
					let transporter;
					/*if (app.get("secrets").smtp) {
						transporter = nodemailer.createTransport(app.get("secrets").smtp || {});
					} else {
						transporter = nodemailer.createTransport(app.get("secrets").sendmail || {});
					}*/
					transporter = nodemailer.createTransport("smtps://m04518fd:Schulcloud1!@w00b3e51.kasserver.com");

					let sendMail = promisify(transporter.sendMail, transporter);
					return sendMail({
						from: process.env.SMTP_SENDER || 'schulcloud@it-stack.de',
						headers: headers,
						to: user ? user.email : email,
						subject: subject,
						html: content.html,
						text: content.text
					});
				});
		}
	}

	return MailService;
};
