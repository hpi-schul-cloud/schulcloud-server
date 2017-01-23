const randexp = require('randexp');
const promisify = require("es6-promisify");
const nodemailer = require('nodemailer');

module.exports = function(app) {

	class MailService {
		constructor() {

		}

		// POST
		create({email, subject, content}, params) {
			var transporter = nodemailer.createTransport(app.get("secrets").smtp);
			var sendMail = promisify(transporter.sendMail, transporter);
			return sendMail({
					from: 'noreply@schul-cloud.org',
					to: email,
					subject: subject,
					html: content.html,
					text: content.text
				});
		}
	}

	return MailService;
};
