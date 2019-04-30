const errors = require('@feathersjs/errors');
const logger = require('winston');
const randexp = require('randexp');
const path = require('path');
const templateDir = path.join(__dirname, 'templates', 'signup');
const EmailTemplate = require('email-templates').EmailTemplate;

module.exports = function (app) {

	let externals = {};

	externals.capitalizeFirstLetter = (string) => {
		return string.charAt(0).toUpperCase() + string.slice(1);
	};

	externals.sendEmail = (firstName, lastName, email, username) => {
		var template = new EmailTemplate(templateDir);
		var user = {
			firstName: firstName.toLowerCase().split(' ').map(externals.capitalizeFirstLetter).join(' '),
			lastName: lastName.toLowerCase().split(' ').map(externals.capitalizeFirstLetter).join(' '),
			username: username
		};

		template.render(user, function (err, results) {
			if (err) {
				return logger.error(err);
			}

			const mailService = app.service('/mails');
			mailService.create({email: email, subject: 'Anmeldedaten Schul-Cloud', content: results});
		});
	};

	return {externals};
};
