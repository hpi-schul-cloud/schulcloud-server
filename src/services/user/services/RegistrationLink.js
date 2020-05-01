const { BadRequest, Forbidden } = require('@feathersjs/errors');

const { SC_SHORT_TITLE, SC_DOMAIN } = require('../../../../config/globals');

const mailContent = (firstName, lastName, registrationLink) => {
	const mail = {
		subject: `Einladung für die Nutzung der ${SC_SHORT_TITLE}!`,
		content: {
			text: `Einladung in die ${SC_SHORT_TITLE}
    Hallo ${firstName} ${lastName}!
    \\nDu wurdest eingeladen, der ${SC_SHORT_TITLE} beizutreten,
    \\nbitte vervollständige deine Registrierung unter folgendem Link: ${registrationLink}
    \\nViel Spaß und einen guten Start wünscht dir dein ${SC_SHORT_TITLE}-Team`,
			html: '',
		},
	};
	return mail;
};

const { userModel } = require('../model');

const getCurrentUserInfo = (id) => userModel.findById(id)
	.select(['schoolId', 'email', 'firstName', 'lastName'])
	.populate('roles')
	.lean()
	.exec();

class RegistrationLink {
	async create(data, params) {
		let totalMailsSend = 0;

		try {
			const { userIds } = data;

			for (const userId of userIds) {
				const account = await this.app.service('/accounts').find({
					query: {
						userId,
					},
				});

				// dont't send mail if user has account
				if ((account || []).length === 0) {
					// get user info from id in userIds
					const user = await Promise.resolve(getCurrentUserInfo(userId));
					if (!user.roles || user.roles.length > 1) {
						throw new BadRequest('Roles must be exactly of length one.');
					}

					// get registrationLink
					const { shortLink } = await this.app.service('/registrationlink')
						.create({
							role: user.roles[0],
							save: true,
							patchUser: true,
							host: SC_DOMAIN,
							schoolId: user.schoolId,
							toHash: user.email,
						});

					// send mail
					const { subject, content } = mailContent(user.firstName, user.lastName, shortLink);
					await this.app.service('/mails')
						.create({
							email: user.email,
							subject,
							content,
						});
					totalMailsSend += 1;
				}
			}

			return Promise.resolve({
				totalReceivedIds: userIds.length,
				totalMailsSend,
				alreadyRegisteredUsers: (userIds.length - totalMailsSend),
			});
		} catch (err) {
			if ((err || {}).code === 403) {
				throw new Forbidden('You have not the permission to execute this!', err);
			}
			throw new BadRequest('Can not send mail(s) with registration link', err);
		}
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = RegistrationLink;
