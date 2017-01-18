const errors = require('feathers-errors');
const logger = require('winston');
const randexp = require('randexp');
const path           = require('path');
const templateDir   = path.join(__dirname, 'templates', 'signup');
const EmailTemplate = require('email-templates').EmailTemplate;

module.exports = function(app) {
	// creates a regex for strings with 17 chars, at least one number, one special character, one uppercase/lowercase char
	const regex = '^(?=.[a-z])(?=.[A-Z])(?=.\d)(?=.[$@$!%?&\,\#\>\<\.\=\§\"\/\(\)\~\+\:\;\.\]\[\_\-\^\{\}\`\'\|\])[A-Za-z\d$@$!%?&>\<\.\§\"\/\(\)\~\#\+\:\;\.\]\[\_\=\,\-\^\{\}\`\'\|]{16,16}';
	let externals = {};
	class AccountHelper {
		constructor() {

		}

		// POST
		create(user) {
			return externals.findUsername(user.firstName, user.lastName)
				.then(username => {
					var password = externals.generatePassword();
					externals.sendEmail(username, password, user.firstName, user.lastName, user.email);
					return {username: username, password: password};
				});
		}
	}

	externals.capitalizeFirstLetter = (string) => {
		return string.charAt(0).toUpperCase() + string.slice(1);
	};

	externals.findUsername = (firstName, lastName) => {
		const accountService = app.service('/accounts');
		var username = firstName.trim().toLowerCase() + '.' + lastName.trim().toLowerCase();

		return accountService.find({query: {username: {$regex : username}}})
			.then(result => {
				var usernames = result;
				var names = new Array;
				usernames.forEach((obj) => {
					names.push(parseInt(obj.username.replace(username, "")));
				});
				username = username + (externals.findMax(names) + 1);

				return username;
			});
	};

	externals.generatePassword = () => {
		return new randexp(regex).gen();
	};

	externals.sendEmail = (username, password, firstName, lastName, email) => {
		var template = new EmailTemplate(templateDir);
		var user = {
			firstName: externals.capitalizeFirstLetter(firstName.toLowerCase()),
			lastName: externals.capitalizeFirstLetter(lastName.toLowerCase()),
			password: password,
			username: username
		};

		template.render(user, function (err, results) {
			if (err) {
				return logger.error(err);
			}

			const mailService = app.service('/mails');

			mailService.create({ email:email, subject:'Schul-Cloud Credentials', content:results });

		});
	};

	externals.findMax = (array) => {
		var max = 0,
			a = array.length,
			counter;

		for (counter=0;counter<a;counter++)
		{
			if (array[counter] > max)
			{
				max = array[counter];
			}
		}
		return max;
	};

	return {AccountHelper, externals};
};
