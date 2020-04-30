/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const { BadRequest, Forbidden } = require('@feathersjs/errors');
const logger = require('../../../logger');

const { SC_SHORT_TITLE } = require('../../../../config/globals');

const mailContent = (firstName, lastName, registrationLink) => {
	const mail = {
		subject: `Einladung für die Nutzung der ${SC_SHORT_TITLE}!`,
		text: `Einladung in die ${SC_SHORT_TITLE}
    Hallo ${firstName} ${lastName}!
    \\nDu wurdest eingeladen, der ${SC_SHORT_TITLE} beizutreten,
    \\nbitte vervollständige deine Registrierung unter folgendem Link: ${registrationLink}
    \\nViel Spaß und einen guten Start wünscht dir dein ${SC_SHORT_TITLE}-Team`,
	};
	return mail;
};

const { userModel } = require('../model');
const roleModel = require('../../role/model');

const getCurrentUserInfo = (id) => userModel.findById(id)
	.select('schoolId')
	.populate('roles')
	.lean()
	.exec();

const getRoles = () => roleModel.find()
	.select('name')
	.lean()
	.exec();

class RegistrationLink {
	constructor() {
		this.permissionThatCanAccess = ['STUDENT_LIST', 'TEACHER_LIST'];
	}

	async find(params) {
		try {
			const { query, account } = params;
			const currentUserId = account.userId.toString();

			const [currentUser, roles] = await Promise.all([getCurrentUserInfo(currentUserId), getRoles()]);

			// permission check
			if (!currentUser.roles.some((role) => this.rolesThatCanAccess.includes(role.name))) {
				throw new Forbidden();
			}

			// get registrationLink

			// send mails
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
