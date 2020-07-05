const path = require('path');

const templateDir = path.join(__dirname, 'templates', 'signup');
const { EmailTemplate } = require('email-templates');
const logger = require('../../logger');

module.exports = function (app) {
	const externals = {};

	externals.capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

	externals.sendEmail = (firstName, lastName, email, username) => {
		const template = new EmailTemplate(templateDir);
		const user = {
			firstName: firstName.toLowerCase().split(' ').map(externals.capitalizeFirstLetter).join(' '),
			lastName: lastName.toLowerCase().split(' ').map(externals.capitalizeFirstLetter).join(' '),
			username,
		};

		template.render(user, (err, results) => {
			if (err) {
				return logger.error(err);
			}

			const mailService = app.service('/mails');
			mailService.create({ email, subject: 'Anmeldedaten Schul-Cloud', content: results });
		});
	};

	return { externals };
};
