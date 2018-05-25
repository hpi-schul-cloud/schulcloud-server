'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

function createinfoText(user, category, subject){
	return "Ein neues Problem wurde gemeldet." + "\n"
	//TODO: try to get the submitted data on POST (wont work on find/get I think) and implement
	+ "User: " + user + "\n"
	+ "Kategorie: "+ category + "\n"
	+ "Betreff: " + subject + "\n"
	+ "Schauen Sie für weitere Details und zur Bearbeitung bitte in das Helpdesk der Schul-Cloud.\n\n"
	+ "Mit Freundlichen Grüßen\nIhr Schul-Cloud Team";
}


//Is this doing anything right now?
const sendHelpdeskEmail = hook => {
	let infoText = "Ein neues Problem wurde gemeldet." + "\n"
		+ "User: [get submitted data] \n"
		+ "Kategorie: [hook.result.data?] \n"
		+ "Betreff: [hook.result.data?] \n"
		+ "Schauen Sie für weitere Details und zur Bearbeitung bitte in das Helpdesk der Schul-Cloud.\n\n"
		+ "Mit Freundlichen Grüßen\nIhr Schul-Cloud Team";
	//TODO: sendEmail() in here not working
	globalHooks.sendEmail({
		"subject":"Ein Problem wurde gemeldet.",
		"roles":["helpdesk", "administrator"],
		"content": {
			"text": infoText
		}
	});
	return hook;
};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [globalHooks.hasPermission('HELPDESK_VIEW')],
	get: [globalHooks.hasPermission('HELPDESK_VIEW')],
	create: [globalHooks.hasPermission('HELPDESK_CREATE'), restrictToCurrentSchool],
	update: [globalHooks.hasPermission('HELPDESK_EDIT'), restrictToCurrentSchool],
	patch: [globalHooks.hasPermission('HELPDESK_EDIT'),globalHooks.permitGroupOperation, restrictToCurrentSchool],
	remove: [globalHooks.hasPermission('HELPDESK_CREATE'),globalHooks.permitGroupOperation, globalHooks.ifNotLocal(globalHooks.checkSchoolOwnership)]
};

//TODO: call from local function sendHelpdeskEmail, not directly, not working
exports.after = {
	all: [],
	find: [],
	get: [],
	create: [ hook => {
		globalHooks.sendEmail(hook, {
			"subject":"Ein Problem wurde gemeldet.",
			"userIds": hook.data.userId,
			//"roles":["helpdesk", "administrator"],
			"content": {
				"text": createinfoText(hook.params.account.username, hook.data.category, hook.data.subject)
			}
		});
	}],
	update: [],
	patch: [],
	remove: []
};
