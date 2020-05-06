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
	.select(['schoolId', 'email', 'firstName', 'lastName', 'preferences'])
	.populate('roles')
	.lean()
	.exec();


const getUserInfos = (ids, app) => app.service('/userModel').find({
	query: {
		_id: ids,
		select: ['schoolId', 'email', 'firstName', 'lastName', 'preferences'],
		$populate: 'roles',
	},
});

class SendRegistrationLinkService {
	async create(data, params) {
		let totalMailsSend = 0;

		try {
			const { userIds: allUserIds } = data;
			let accounts = await this.app.service('/accounts').find({
				query: {
					userId: allUserIds,
				},
			});
			accounts = accounts.map((account) => String(account.userId));
			const userIds = allUserIds.filter(
				(id) => undefined !== accounts.find((a) => a.userId.toString() === id.toString()),
			);

			const users = await getUserInfos(userIds, this.app);

			await Promise.all(users.map(async (user) => {
				// get registrationLink
				const { shortLink, hash } = await this.app.service('/registrationlink')
					.create({
						role: user.roles[0],
						save: true,
						patchUser: true,
						schoolId: user.schoolId,
						importHash: user.importHash,
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

				const updates = {};

				if (!user.importHash) {
					updates.importHash = hash;
				}
				if (!(user.preferences || {}).registrationMailSend) {
					updates.preferences = {
						registrationMailSend: true,
						...user.preferences,
					};
				}

				if (Object.getOwnPropertyNames(updates).length !== 0) {
					return this.app.service('/userModel').patch(user._id, {
						importHash: hash,
					});
				}

				return Promise.resolve();
			}));

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
