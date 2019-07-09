const hooks = require('feathers-hooks-common');
const auth = require('@feathersjs/authentication');
const logger = require('../../../logger');
const globalHooks = require('../../../hooks');
const pinModel = require('../../user/model').registrationPinModel;
const { mailToLowerCase } = require('./global');


const removeOldPins = hook => pinModel.deleteMany({ email: hook.data.email })
	.then(pins => Promise.resolve(hook));

const generatePin = (hook) => {
	const pin = Math.floor((Math.random() * 8999) + 1000);
	hook.data.pin = pin.toString();
	return Promise.resolve(hook);
};

function createinfoText(hook) {
	let text;
	const role = hook.data.mailTextForRole;
	const { pin } = hook.data;
	const shortTitle = process.env.SC_SHORT_TITLE || 'Schul-Cloud*';
	const longTitle = process.env.SC_TITLE || 'HPI Schul-Cloud*';
	if (!role || !pin) {
		logger.warning('Role or PIN missing to define mail text.');
		return '';
	}
	if (role === 'parent') {
		text = `Vielen Dank, dass Sie Ihrem Kind durch Ihr Einverständnis die Nutzung der ${longTitle} ermöglichen.
Bitte geben Sie folgenden Code ein, wenn Sie danach gefragt werden, um die Registrierung abzuschließen:

PIN: ${pin}

Mit Freundlichen Grüßen
Ihr ${shortTitle} Team`;
	} else if (role === 'student' || role === 'employee' || role === 'expert') {
		text = `Vielen Dank, dass du die ${longTitle} nutzen möchtest.
Bitte gib folgenden Code ein, wenn du danach gefragt wirst, um die Registrierung abzuschließen:

PIN: ${pin}

Mit freundlichen Grüßen
Dein ${shortTitle} Team`;
	} else {
		logger.warning('No valid role submitted to define mail text.');
		return '';
	}
	return text;
}

const checkAndVerifyPin = (hook) => {
	if (hook.result.data.length === 1 && hook.result.data[0].verified === false) {
		return hook.app
			.service('registrationPins')
			.patch(hook.result.data[0]._id, { verified: true })
			.then(() => Promise.resolve(hook));
	}
	return Promise.resolve(hook);
};

const mailPin = (hook) => {
	if (!(hook.data || {}).silent) {
		globalHooks.sendEmail(hook, {
			subject: `${process.env.SC_SHORT_TITLE || 'Schul-Cloud*'}: Registrierung mit PIN verifizieren`,
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
	if (process.env.NODE_ENV === 'test') {
		return Promise.resolve(hook);
	}

	if (((hook.params || {}).account || {}).userId) {
		const userService = hook.app.service('/users/');
		const currentUser = await userService.get(hook.params.account.userId, { query: { $populate: 'roles' } });
		const userRoles = currentUser.roles.map(role => role.name);
		if (userRoles.includes('superhero')) {
			return Promise.resolve(hook);
		}
	}

	globalHooks.removeResponse()(hook);
	return Promise.resolve(hook);
};

exports.before = {
	all: [globalHooks.forceHookResolve(auth.hooks.authenticate('jwt')), mailToLowerCase],
	find: hooks.disable('external'),
	get: hooks.disable('external'),
	create: [removeOldPins, generatePin, mailPin],
	update: hooks.disable('external'),
	patch: hooks.disable('external'),
	remove: hooks.disable('external'),
};

exports.after = {
	all: [globalHooks.removeResponse(['get', 'find', 'create'])],
	find: [checkAndVerifyPin],
	get: [],
	create: [returnPinOnlyToSuperHero],
	update: [],
	patch: [],
	remove: [],
};
