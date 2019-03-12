const logger = require('winston');
const path = require('path');
const { EmailTemplate } = require('email-templates');

const templateDir = path.join(__dirname, 'templates', 'signup');

module.exports = function setup(app) {
	const externals = {};

	externals.capitalizeFirstLetter = string => string.charAt(0).toUpperCase() + string.slice(1);

	externals.sendEmail = (firstName, lastName, email, username) => {
		const template = new EmailTemplate(templateDir);
		const user = {
			firstName: firstName.toLowerCase().split(' ').map(externals.capitalizeFirstLetter).join(' '),
			lastName: lastName.toLowerCase().split(' ').map(externals.capitalizeFirstLetter).join(' '),
			username,
		};

		template.render(user, (err, results) => {
			if (err) {
				logger.error(err);
			}

			const mailService = app.service('/mails');
			mailService.create({ email, subject: 'Anmeldedaten Schul-Cloud', content: results });
		});
	};

	return { externals };
};
