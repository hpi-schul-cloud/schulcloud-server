const promisify = require("es6-promisify");
const nodemailer = require('nodemailer');

module.exports = function (app) {

	class MailService {
		constructor() {

		}

		// POST
		create({headers, email, subject, content}, params) {
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
				to: email,
				subject: subject,
				html: content.html,
				text: content.text
			});
		}
	}

	return MailService;
};
