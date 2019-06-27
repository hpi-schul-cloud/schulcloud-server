const { BadRequest, Forbidden } = require('@feathersjs/errors');

const validateRequest = (data, targetUser, actingUser) => {
	// check persmissison
	const targetIsStudent = targetUser.roles[0].name === 'student';
	const targetIsTeacher = targetUser.roles[0].name === 'teacher';
	let hasPermission = false;

	if (targetIsStudent && actingUser.permissions.includes('STUDENT_SKIP_REGISTRATION')) {
		hasPermission = true;
	}
	if (targetIsTeacher && actingUser.permissions.includes('TEACHER_SKIP_REGISTRATION')) {
		hasPermission = true;
	}
	if (!hasPermission) return Promise.reject(new Forbidden('you do not have permission to do this!'));

	// sanitize
	if (!((data.parent_privacyConsent && data.parent_termsOfUseConsent)
		|| (data.privacyConsent && data.termsOfUseConsent))) {
		return Promise.reject(new BadRequest('you have to set valid consents!'));
	}
	if (!data.password) return Promise.reject(new BadRequest('you have to set a password!'));
	if (targetIsStudent && !data.birthday) return Promise.reject(new BadRequest('students require a birtdate'));

	// todo: what status code?
	if (!targetUser.importHash) return Promise.reject(new BadRequest('this user is not viable for registration'));
	return Promise.resolve(true);
};

const createAccount = (data, targetUser) => Promise.resolve(data, targetUser);

const updateConsent = (data, targetUser) => Promise.resolve(data, targetUser);

const updateUserBirthdate = (data, targetUser) => Promise.resolve(data, targetUser);

class SkipRegistrationService {
	constructor() {
		this.docs = {};
	}

	async create(data, params) {
		try {
			const targetUser = await this.app.service('users').get(params.route.userid,
				{ query: { $populate: 'roles' } });
			const actingUser = await this.app.service('users').get(params.route.userid);
			await validateRequest(data, targetUser, actingUser);

			await Promise.all(createAccount, updateConsent, updateUserBirthdate);

			return Promise.resolve(data);
		} catch (err) {
			throw err;
		}

		// create account
		// set consents
		// update birthdate
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = SkipRegistrationService;
