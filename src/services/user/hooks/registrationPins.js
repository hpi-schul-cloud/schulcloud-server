'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const _ = require('lodash');
let pin = null;

const removeOldPin = (hook) => {
	return hook.app.service('registrationPins').find({email: hook.data.email})
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

function createinfoHtml(){
	return "HTML: Vielen Dank, dass Sie Ihrem Kind durch Ihr Einverständnis die Nutzung der HPI Schul-Cloud ermöglichen.\n" +
		"Bitte geben Sie folgenden Code ein, wenn Sie danach gefragt werden, um die Registrierung abzuschließen.\n\n" +
		"<span style='font-size:200%;font-weight:bold;'>PIN: " + pin + "</span>\n\n" +
		"Mit Freundlichen Grüßen\nIhr Schul-Cloud Team";
}
function createinfoText(){
	return "Vielen Dank, dass Sie Ihrem Kind durch Ihr Einverständnis die Nutzung der HPI Schul-Cloud ermöglichen.\n" +
		"Bitte geben Sie folgenden Code ein, wenn Sie danach gefragt werden, um die Registrierung abzuschließen.\n\n" +
		"PIN: " + pin + "\n\n" +
		"Mit Freundlichen Grüßen\nIhr Schul-Cloud Team";
}

const mailPin = (hook) => {
	globalHooks.sendEmail(hook, {
		"subject": "Schul-Cloud: Registrierung mit PIN verifizieren",
		"emails": (hook.data||{}).email,
		"content": {
			"html": createinfoHtml(),
			"text": createinfoText()
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
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: []
};
