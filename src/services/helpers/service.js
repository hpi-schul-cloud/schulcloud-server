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
					if (process.env.NODE_ENV === 'production') {
						transporter = nodemailer.createTransport(app.get("secrets").sendmail || {});
					} else {
						transporter = nodemailer.createTransport(app.get("secrets").smtp || {});
					}

					let sendMail = promisify(transporter.sendMail, transporter);
					return sendMail({
						from: 'noreply@schul-cloud.org',
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
