const hooks = require('feathers-hooks-common');
const { authenticate } = require('@feathersjs/authentication');
const { BadRequest, Forbidden } = require('@feathersjs/errors');
const { Configuration } = require('@schul-cloud/commons');
const { NODE_ENV, ENVIRONMENTS, SC_TITLE, SC_SHORT_TITLE } = require('../../../../config/globals');
const globalHooks = require('../../../hooks');
const pinModel = require('../model').registrationPinModel;
const { getRandomInt } = require('../../../utils/randomNumberGenerator');

const removeOldPins = (hook) => pinModel.deleteMany({ email: hook.data.email }).then(() => Promise.resolve(hook));

const generatePin = (hook) => {
	const pin = getRandomInt(9999, 1000);
	hook.data.pin = pin.toString();
	return Promise.resolve(hook);
};

function createinfoText(hook) {
	const role = hook.data.mailTextForRole;
	const { pin } = hook.data;
	if (!pin) {
		throw new BadRequest('Fehler beim Erstellen der Pin.');
	}

	if (role === 'parent') {
		let consentWords = 'durch Ihr Einverständnis ';

		const skipConsentRoles = Configuration.get('SKIP_CONDITIONS_CONSENT');
		if (skipConsentRoles !== '' && skipConsentRoles.length > 1) {
			consentWords = '';
		}

		return `Vielen Dank, dass Sie Ihrem Kind ${consentWords}die Nutzung der ${SC_TITLE} ermöglichen.
Bitte geben Sie den folgenden Bestätigungscode im Registrierungsprozess ein, um die Registrierung abzuschließen:

PIN: ${pin}

Mit Freundlichen Grüßen
Ihr ${SC_SHORT_TITLE}-Team`;
	}
	if (role === 'student' || role === 'employee' || role === 'expert') {
		return `Vielen Dank, dass du die ${SC_TITLE} nutzen möchtest.
Bitte gib den folgenden Bestätigungscode im Registrierungsprozess ein,
um deine Registrierung bei der ${SC_TITLE} abzuschließen:

PIN: ${pin}

Mit freundlichen Grüßen
Dein ${SC_SHORT_TITLE}-Team`;
	}
	throw new BadRequest('Die angegebene Rolle ist ungültig.', { role });
}

const checkAndVerifyPin = (hook) => {
	if (hook.result.data.length === 0) {
		return hook;
	}
	if (hook.result.data.length === 1) {
		const firstDataItem = hook.result.data[0];
		// check generation age
		const now = Date.now();
		if (firstDataItem.updatedAt.getTime() + Configuration.get('PIN_MAX_AGE_SECONDS') * 1000 < now) {
			throw new Forbidden('Der eingegebene Code ist nicht mehr gültig. Bitte fordere einen neuen Code an.');
		}
		if (firstDataItem.verified === true) {
			// already verified
			return hook;
		}
		if (firstDataItem.pin) {
			if (firstDataItem.pin === hook.params.query.pin) {
				return hook.app
					.service('registrationPins')
					.patch(firstDataItem._id, { verified: true })
					.then((result) => {
						hook.result.data = [result];
						return hook;
					});
			}
			throw new BadRequest(
				'Der eingegebene Code ist ungültig oder konnte nicht bestätigt werden. Bitte versuche es erneut.'
			);
		}
		return hook;
	}
	throw new BadRequest('Only one result allowed here');
};

const mailPin = (hook) => {
	if (!(hook.data || {}).silent) {
		globalHooks.sendEmail(hook, {
			subject: `${SC_SHORT_TITLE}: Registrierung mit PIN verifizieren`,
			emails: (hook.data || {}).email,
			content: {
				text: createinfoText(hook),
				// TODO: implement html mails later
			},
		});
	}
	return Promise.resolve(hook);
};

const returnPinOnlyToSuperHero = async (hook) => {
	if (NODE_ENV === ENVIRONMENTS.TEST) {
		return Promise.resolve(hook);
	}

	if (((hook.params || {}).account || {}).userId) {
		const userService = hook.app.service('/users/');
		const currentUser = await userService.get(hook.params.account.userId, { query: { $populate: 'roles' } });
		const userRoles = currentUser.roles.map((role) => role.name);
		if (userRoles.includes('superhero')) {
			return Promise.resolve(hook);
		}
	}

	globalHooks.removeResponse()(hook);
	return Promise.resolve(hook);
};

const validateEmailAndPin = (hook) => {
	const { email, pin } = hook.params.query;
	if (!hook.params.query || !email) {
		throw new BadRequest('email required');
	}
	if (
		email &&
		typeof email === 'string' &&
		email.length &&
		(!pin || (pin && typeof pin === 'string' && pin.length === 4))
	) {
		return hook;
	}
	throw new BadRequest('pin or email invalid', { email, pin });
};

exports.before = {
	all: [globalHooks.forceHookResolve(authenticate('jwt'))],
	find: [hooks.disallow('external'), validateEmailAndPin],
	get: hooks.disallow('external'),
	create: [globalHooks.blockDisposableEmail('email'), removeOldPins, generatePin],
	update: hooks.disallow('external'),
	patch: hooks.disallow('external'),
	remove: hooks.disallow('external'),
};

exports.after = {
	all: [globalHooks.removeResponse(['get', 'find', 'create'])],
	find: [checkAndVerifyPin],
	get: [],
	create: [mailPin, returnPinOnlyToSuperHero],
	update: [],
	patch: [],
	remove: [],
};
