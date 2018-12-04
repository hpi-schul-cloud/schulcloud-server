'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

function createInfoText(user, data){
	return "Ein neues Problem wurde gemeldet." + "\n"
	+ "User: " + user + "\n"
	+ "Kategorie: "+ data.category + "\n"
	+ "Betreff: " + data.subject + "\n"
	+ "Schaue für weitere Details und zur Bearbeitung bitte in den Helpdesk-Bereich der "+ data.cloud +".\n\n"
	+ "Mit freundlichen Grüßen\n"
	+ "Deine " + data.cloud;
}

function createFeedbackText(user, data){
	let text = "User: " + user + "\n"
	+ "Schule: " + data.schoolName + "\n"
	+ "Instanz: " + data.cloud + "\n"
	+ "Bereich ausgewählt: " + data.category + "\n";
	if (data.desire && data.desire != ""){
		text = text + "User schrieb folgendes: \n"
		+ "Als " + data.role + "\n"
        + "möchte ich " + data.desire + ",\n"
		+ "um " + data.benefit + ".\n"
		+ "Akzeptanzkriterien: " + data.acceptanceCriteria;
	} else {
		text = text + "User meldet folgendes: \n"
		+ "Problem Kurzbeschreibung: " + data.subject + "\n"
		+ "IST-Zustand: " + data.currentState + "\n"
		+ "SOLL-Zustand: " + data.targetState;
		if(data.notes) text = text + "\n Anmerkungen: " + data.notes;
	}
	return text;
}

const denyDbWriteOnType = hook => {
	if (hook.data.type === "contactHPI"){
		hook.result = {}; //interrupts db interaction
	}
	return hook;
};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [globalHooks.hasPermission('HELPDESK_VIEW')],
	get: [globalHooks.hasPermission('HELPDESK_VIEW')],
	create: [globalHooks.hasPermission('HELPDESK_CREATE'), restrictToCurrentSchool, denyDbWriteOnType],
	update: [globalHooks.hasPermission('HELPDESK_EDIT'), restrictToCurrentSchool],
	patch: [globalHooks.hasPermission('HELPDESK_EDIT'),globalHooks.permitGroupOperation, restrictToCurrentSchool],
	remove: [globalHooks.hasPermission('HELPDESK_CREATE'),globalHooks.permitGroupOperation, globalHooks.ifNotLocal(globalHooks.checkSchoolOwnership)]
};

const feedback = () => {
	return hook=>{
		const data=hook.data||{};
		if (data.type === "contactAdmin"){
			globalHooks.sendEmail(hook, {
				"subject": "Ein Problem wurde gemeldet.",
				"roles": ["helpdesk", "administrator"],
				"content": {
					"text": createInfoText(
						(hook.params.account||{}).username||"nouser",
						data)
				}
			});
			//TODO: NOTIFICATION SERVICE
		} else {
			globalHooks.sendEmail(hook, {
				"subject": data.subject||"nosubject",
				"emails": ["ticketsystem@schul-cloud.org"],
				"content": {
					"text": createFeedbackText(
						(hook.params.account||{}).username||"nouser",
						data
					)
				}
			});
		}
		return Promise.resolve(hook);
	};
 };

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [feedback()],
	update: [],
	patch: [],
	remove: []
};
