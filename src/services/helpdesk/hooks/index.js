'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

function createinfoText(user, category, subject){
	return "Ein neues Problem wurde gemeldet." + "\n"
	+ "User: " + user + "\n"
	+ "Kategorie: "+ category + "\n"
	+ "Betreff: " + subject + "\n"
	+ "Schauen Sie für weitere Details und zur Bearbeitung bitte in das Helpdesk der Schul-Cloud.\n\n"
	+ "Mit Freundlichen Grüßen\nIhr Schul-Cloud Team";
}

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [globalHooks.hasPermission('HELPDESK_VIEW')],
	get: [globalHooks.hasPermission('HELPDESK_VIEW')],
	create: [globalHooks.hasPermission('HELPDESK_CREATE'), restrictToCurrentSchool],
	update: [globalHooks.hasPermission('HELPDESK_EDIT'), restrictToCurrentSchool],
	patch: [globalHooks.hasPermission('HELPDESK_EDIT'),globalHooks.permitGroupOperation, restrictToCurrentSchool],
	remove: [globalHooks.hasPermission('HELPDESK_CREATE'),globalHooks.permitGroupOperation, globalHooks.ifNotLocal(globalHooks.checkSchoolOwnership)]
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [ hook => {
		globalHooks.sendEmail(hook, {
			"subject": "Ein Problem wurde gemeldet.",
			"roles": ["helpdesk", "administrator"],
			"content": {
				"text": createinfoText(hook.params.account.username, hook.data.category, hook.data.subject)
			}
		});
	}],
	update: [],
	patch: [],
	remove: []
};
