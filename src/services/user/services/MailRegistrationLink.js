const { authenticate } = require('@feathersjs/authentication').hooks;
const { BadRequest, Forbidden } = require('@feathersjs/errors');
const { hasPermission } = require('../../../hooks');

const { SC_SHORT_TITLE } = require('../../../../config/globals');

const mailContent = (firstName, lastName, registrationLink) => {
	const mail = {
		subject: `Einladung für die Nutzung der ${SC_SHORT_TITLE}!`,
		content: {
			text: `Einladung in die ${SC_SHORT_TITLE}
Hallo ${firstName} ${lastName}!
\nDu wurdest eingeladen, der ${SC_SHORT_TITLE} beizutreten,
\nbitte vervollständige deine Registrierung unter folgendem Link: ${registrationLink}
\nViel Spaß und einen guten Start wünscht dir dein ${SC_SHORT_TITLE}-Team`,
			html: '',
		},
	};
	return mail;
};

const { userModel } = require('../model');

const getCurrentUserInfo = (id) => userModel.findById(id)
	.select(['schoolId', 'email', 'firstName', 'lastName', 'preferences'])
	.populate('roles')
	.lean()
	.exec();

class SendRegistrationLinkService {
	async create(data, params) {
		let totalMailsSend = 0;

		try {
			const { userIds } = data;
			let accounts = await this.app.service('/accounts').find({
				query: {
					userId: userIds,
				},
			});
			accounts = accounts.map((account) => String(account.userId));

			for (const userId of userIds) {
				// dont't send mail if user has account
				if (!accounts.includes(userId)) {
					// get user info from id in userIds
					const user = await getCurrentUserInfo(userId);

					// get registrationLink
					const { shortLink } = await this.app.service('/registrationlink')
						.create({
							role: user.roles[0],
							save: true,
							patchUser: true,
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

					if (!(user.preferences || {}).registrationMailSend) {
						const updatedPreferences = user.preferences || {};
						updatedPreferences.registrationMailSend = true;
						await this.app.service('users')
							.patch(user._id, { preferences: updatedPreferences }, params);
					}
					totalMailsSend += 1;
				}
			}

			return {
				totalReceivedIds: userIds.length,
				totalMailsSend,
				alreadyRegisteredUsers: (userIds.length - totalMailsSend),
			};
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

const SendRegistrationLinkHooks = {
	before: {
		all: [authenticate('jwt'), hasPermission(['STUDENT_LIST', 'TEACHER_LIST'])],
	},
};

module.exports = {
	Hooks: SendRegistrationLinkHooks,
	Service: SendRegistrationLinkService,
};
