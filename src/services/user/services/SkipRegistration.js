const reqlib = require('app-root-path').require;

const { BadRequest } = reqlib('src/errors');

/**
 * validate that request data is complete and valid.
 * @param {object} data complete data object from the call.
 * @param {User} targetUser the user that will be targeted, with populated roles.
 * @throws {BadRequest} if data attributes are missing.
 */
const validateRequest = (data, targetUser) => {
	const targetIsStudent = targetUser.roles[0].name === 'student';
	if (
		!((data.parent_privacyConsent && data.parent_termsOfUseConsent) || (data.privacyConsent && data.termsOfUseConsent))
	) {
		return Promise.reject(new BadRequest('you have to set valid consents!'));
	}
	if (!data.password) return Promise.reject(new BadRequest('you have to set a password!'));
	if (targetIsStudent && !data.birthday) return Promise.reject(new BadRequest('students require a birthdate'));

	// todo: what status code?
	if (!targetUser.importHash) return Promise.reject(new BadRequest('this user is not viable for registration'));
	return Promise.resolve(true);
};

/**
 * creates an account, as if the user just went through registration.
 * @param {Object} data the request data, containing a valid password.
 * @param {User} targetUser the user that will be targeted, with populated roles.
 * @param {App} app the app object.
 */
const createAccount = async function createAccount(data, targetUser, app) {
	const existingAccount = await app.service('accounts').find({ query: { userId: targetUser._id } });
	if (existingAccount.length === 0) {
		return app.service('accounts').create({
			userId: targetUser._id,
			password: data.password,
			username: targetUser.email,
			activated: true,
		});
	}
	// what in case of SSO users?
	return Promise.resolve();
};

/**
 * writes consents according to data, as if the user just went through registration.
 * @param {Object} data the request data, containing valid consents.
 * @param {ObjectId} targetUserId id of the user the consents belong to.
 * @param {App} app the app object.
 */
const updateConsent = (data, targetUserId, app) => {
	const consent = { userId: targetUserId };
	if (data.parent_privacyConsent || data.parent_termsOfUseConsent) {
		consent.parentConsents = [
			{
				form: 'analog',
				privacyConsent: data.parent_privacyConsent,
				termsOfUseConsent: data.parent_termsOfUseConsent,
			},
		];
	}
	if (data.privacyConsent || data.termsOfUseConsent) {
		consent.userConsent = {
			form: 'analog',
			privacyConsent: data.privacyConsent,
			termsOfUseConsent: data.termsOfUseConsent,
		};
	}
	return app.service('consents').create(consent);
};

/**
 * removes the importhash from a user if parent consent was given,
 * sets birthday if given,
 * as if the user just went through registration.
 * @param {Object} data the request data, may contain a birthday.
 * @param {ObjectId} targetUserId the id of the user to be updated.
 * @param {App} app the app object.
 */
const updateUser = (data, targetUserId, app) => {
	const needsParentConsent = !data.parent_privacyConsent || !data.parent_termsOfUseConsent;
	if (needsParentConsent) {
		app.service('users').patch(targetUserId, { birthday: data.birthday });
	} else {
		app.service('users').patch(targetUserId, { birthday: data.birthday, $unset: { importHash: '' } });
	}
};

class SkipRegistrationService {
	constructor() {
		this.docs = {};
	}

	async skipUserRegistration(data) {
		const targetUser = await this.app.service('users').get(data.userId, { query: { $populate: 'roles' } });
		await validateRequest(data, targetUser);

		await Promise.all([
			createAccount(data, targetUser, this.app),
			updateConsent(data, targetUser._id, this.app),
			updateUser(data, targetUser._id, this.app),
		]);

		return Promise.resolve('success');
	}

	/**
	 * POST /users/{id}/skipregistration
	 * skips the registration of another user, making the necessary changes as if the user went through registration.
	 * Only works on users that have an importHash.
	 * @param {Object} data should contain consents, a password, and if the target is a student a birthday.
	 * @param {Object} params accepts no params besides the ones automatically set by feathers.
	 * @returns 201 - success
	 * @throws {BadRequest} if data is not set correctly
	 * @throws {Forbidden} if caller does not have permission to skip the target users registration.
	 * @memberof SkipRegistrationService
	 */
	async create(data, params) {
		if ((params.route || {}).userId) {
			data.userId = params.route.userId;
			return this.skipUserRegistration(data);
		}
		if (Array.isArray(data.dataObjects)) {
			const promiseResults = await Promise.allSettled(data.dataObjects.map((d) => this.skipUserRegistration(d)));
			const result = promiseResults.map((r) => ({
				success: r.status === 'fulfilled',
				error: r.reason,
			}));
			return result;
		}
		throw new BadRequest('invalid data!');
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = SkipRegistrationService;
