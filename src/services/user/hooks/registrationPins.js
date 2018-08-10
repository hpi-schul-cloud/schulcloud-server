'use strict';

const globalHooks = require('../../../hooks');
let pin = null;

const removeOldPin = (hook) => {
	return hook.app.service('registrationPins').find({query:{email: hook.data.email}})
		.then(pins => {
			if (pins.total > 0) {
				return hook.app.service('registrationPins').remove(pins.data[0]._id)
					.then(response => {
						return Promise.resolve(hook);
					});
				}
			return Promise.resolve(hook);
		});
};

const generatePin = (hook) => {
	pin = Math.floor((Math.random() * 8999)+1000);
	hook.data.pin = pin.toString();
	return Promise.resolve(hook);
};

function createinfoText(hook) {
	let text;
	if (hook.data.byParent === true || hook.data.byParent === "true") {
		text = `Vielen Dank, dass Sie Ihrem Kind durch Ihr Einverständnis die Nutzung der HPI Schul-Cloud ermöglichen.
Bitte geben Sie folgenden Code ein, wenn Sie danach gefragt werden, um die Registrierung abzuschließen.

PIN: ${pin}

Mit Freundlichen Grüßen
Ihr Schul-Cloud Team`;
	
	} else {
		text = `Vielen Dank, dass du die HPI Schul-Cloud nutzen möchtest.
Bitte gib folgenden Code ein, wenn du danach gefragt wirst, um die Registrierung abzuschließen.

PIN: ${pin}

Mit Freundlichen Grüßen
Ihr Schul-Cloud Team`;
	}
	return text;
}

const checkAndVerifyPin = hook =>{
	if(hook.result.data.length === 1 && hook.result.data[0].verified===false) {
		hook.app.service('registrationPins').patch(hook.result.data[0]._id, {verified: true});
	}
};

const mailPin = (hook) => {
	globalHooks.sendEmail(hook, {
		"subject": "Schul-Cloud: Registrierung mit PIN verifizieren",
		"emails": (hook.data||{}).email,
		"content": {
			"text": createinfoText(hook)
			// TODO: implement html mails later
		}
	});
	return Promise.resolve(hook);
};

exports.before = {
	all: [],
	find: [],
	get: [],
	create: [removeOldPin, generatePin, mailPin],
	update: [],
	patch: [],
	remove: []
};

exports.after = {
	all: [],
	find: [checkAndVerifyPin],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: []
};
