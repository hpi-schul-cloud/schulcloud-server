'use strict';

const commonHooks = require('feathers-hooks-common');
const globalHooks = require('../../../hooks');
const logger = require('winston');
const auth = require('feathers-authentication');
const pinModel = require('../../user/model').registrationPinModel;

const removeOldPins = (hook) => {
	return pinModel.deleteMany({email:hook.data.email})
		.then(pins => {
			return Promise.resolve(hook);
		});
};

const generatePin = (hook) => {
	let pin = Math.floor((Math.random() * 8999)+1000);
	hook.data.pin = pin.toString();
	return Promise.resolve(hook);
};

function createinfoText(hook) {
	let text;
	let role = hook.data.mailTextForRole;
	let pin = hook.data.pin;
	if (!role || !pin) {
		logger.warn("Role or PIN missing to define mail text.");
		return "";
	}
	if (role === "parent") {
		text = `Vielen Dank, dass Sie Ihrem Kind durch Ihr Einverständnis die Nutzung der HPI Schul-Cloud ermöglichen.
Bitte geben Sie folgenden Code ein, wenn Sie danach gefragt werden, um die Registrierung abzuschließen.

PIN: ${pin}

Mit Freundlichen Grüßen
Ihr Schul-Cloud Team`;

	} else if (role === "student" || role === "employee") {
		text = `Vielen Dank, dass du die HPI Schul-Cloud nutzen möchtest.
Bitte gib folgenden Code ein, wenn du danach gefragt wirst, um die Registrierung abzuschließen.

PIN: ${pin}

Mit freundlichen Grüßen
Ihr Schul-Cloud Team`;
	} else {
		logger.warn("No valid role submitted to define mail text.");
		return "";
	}
	return text;
}

const checkAndVerifyPin = hook => {
	if(hook.result.data.length === 1 && hook.result.data[0].verified===false) {
		return hook.app.service('registrationPins').patch(hook.result.data[0]._id, {verified: true}).then(() => {
			return Promise.resolve(hook);
		});
	} else {
		return Promise.resolve(hook);
	}
};

const mailPin = (hook) => {
	if (!(hook.data||{}).silent) {
		globalHooks.sendEmail(hook, {
			"subject": "Schul-Cloud: Registrierung mit PIN verifizieren",
			"emails": (hook.data||{}).email,
			"content": {
				"text": createinfoText(hook)
				// TODO: implement html mails later
			}
		});
	}
	return Promise.resolve(hook);
};

const returnPinOnlyToSuperHero = async (hook) => {
	if (process.env.NODE_ENV === 'test'){
		return Promise.resolve(hook);
	}

	if(((hook.params||{}).account||{}).userId){
		const userService = hook.app.service('/users/');
		const currentUser = await userService.get(hook.params.account.userId, {query: {$populate: 'roles'}});
		const userRoles = currentUser.roles.map((role) => {return role.name;});
		if(userRoles.includes('superhero')){
			return Promise.resolve(hook);
		}
	}

	globalHooks.removeResponse()(hook);
	return Promise.resolve(hook);
};

exports.before = {
	all: [globalHooks.forceHookResolve(auth.hooks.authenticate('jwt'))],
	find: commonHooks.disable('external'),
	get: commonHooks.disable('external'),
	create: [removeOldPins, generatePin, mailPin],
	update: commonHooks.disable('external'),
	patch: commonHooks.disable('external'),
	remove: commonHooks.disable('external'),
};

exports.after = {
	all: [globalHooks.removeResponse(['get', 'find', 'create'])],
	find: [checkAndVerifyPin],
	get: [],
	create: [returnPinOnlyToSuperHero],
	update: [],
	patch: [],
	remove: []
};
