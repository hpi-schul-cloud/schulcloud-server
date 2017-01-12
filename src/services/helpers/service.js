const errors = require('feathers-errors');
const logger = require('winston');
const randexp = require('randexp');
const nodemailer = require('nodemailer');

module.exports = function(app) {

	class MailService {
		constructor() {

		}

		// POST
		create({email, subject, content}, params) {
			var transporter = nodemailer.createTransport('');
			transporter.sendMail({
				from: 'noreply@schul-cloud.org',
				to: email,
				subject: subject,
				html: content.html,
				text: content.text
			}, function (err) {
				if (err) {
					logger.error(err);
				}
			});
		}
	}

	return MailService;
};
