/* eslint-disable no-await-in-loop */
const { authenticate } = require('@feathersjs/authentication').hooks;

const { BadRequest } = require('../../../errors');
const { hasPermission } = require('../../../hooks');

const { SC_SHORT_TITLE, SC_TITLE } = require('../../../../config/globals');

const mailContent = (firstName, lastName, registrationLink) => {
	const mail = {
		subject: `Einladung für die Nutzung der ${SC_TITLE}!`,
		content: {
			text: `Einladung in die ${SC_TITLE}
Hallo ${firstName} ${lastName}!
\nDu wurdest eingeladen, der ${SC_TITLE} beizutreten, bitte vervollständige deine Registrierung unter folgendem Link: 
${registrationLink}
\nViel Spaß und einen guten Start wünscht dir dein ${SC_SHORT_TITLE}-Team`,
			html: '',
		},
	};
	return mail;
};

const getCurrentUserInfo = async (id, app) => {
	const user = await app.service('usersModel').find({
		query: {
			_id: id,
			$select: ['schoolId', 'email', 'firstName', 'lastName', 'preferences'],
			$populate: 'roles',
		},
		paginate: false,
	});
	if ((user || []).length === 1) return user[0];
	return null;
};

class SendRegistrationLinkService {
	async create(data, params) {
		let totalMailsSend = 0;
		const { userIds = [], users = [] } = data;

		let mailUsers = [];
		if (userIds.length > 0 && users.length > 0) {
			throw new BadRequest('user and userIds cannot be passed at the same time to the SendRegistrationLinkService');
		} else if (userIds.length > 0) {
			mailUsers = await Promise.all(userIds.map((userId) => getCurrentUserInfo(userId, this.app)));
		} else {
			mailUsers = users;
		}

		let accounts = await this.app.service('/accounts').find({
			query: {
				userId: mailUsers.map((u) => u._id),
			},
		});
		accounts = accounts.map((account) => String(account.userId));

		const mailUsersWithoutAccount = mailUsers.filter((u) => !accounts.includes(u._id.toString()));

		for (const mailUser of mailUsersWithoutAccount) {
			const mailUserRole = !mailUser.roles[0].name
				? await this.app.service('/roles').get(mailUser.roles[0])
				: mailUser.roles[0];

			const { shortLink } = await this.app.service('/registrationlink').create({
				role: mailUserRole,
				save: true,
				patchUser: true,
				schoolId: mailUser.schoolId,
				toHash: mailUser.email,
			});

			// send mail
			const { subject, content } = mailContent(mailUser.firstName, mailUser.lastName, shortLink);
			await this.app.service('/mails').create({
				email: mailUser.email,
				subject,
				content,
			});

			if (!(mailUser.preferences || {}).registrationMailSend) {
				const updatedPreferences = mailUser.preferences || {};
				updatedPreferences.registrationMailSend = true;
				await this.app.service('users').patch(mailUser._id, { preferences: updatedPreferences }, params);
			}
			totalMailsSend += 1;
		}

		return {
			totalReceivedIds: mailUsers,
			totalMailsSend,
			alreadyRegisteredUsers: mailUsers - totalMailsSend,
		};
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
