const promisify = require('es6-promisify');
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
		create({
			headers, email, subject, content,
		}, params) {
			return checkForToken(params, app)
				.then((user) => {
					let transporter;
					if (app.get('secrets').smtp) {
						transporter = nodemailer.createTransport(app.get('secrets').smtp || {});
					} else {
						transporter = nodemailer.createTransport(app.get('secrets').sendmail || {});
					}

					const sendMail = promisify(transporter.sendMail, transporter);
					return sendMail({
						from: process.env.SMTP_SENDER || 'noreply@schul-cloud.org',
						headers,
						to: user ? user.email : email,
						subject,
						html: content.html,
						text: content.text,
					});
				}).catch(err => Promise.reject(err));
		}
	}

	return MailService;
};
