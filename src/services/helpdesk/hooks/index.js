'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const UAParser = require('ua-parser-js');
const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

function createInfoText(user, data){
	return "Ein neues Problem wurde gemeldet." + "\n"
	+ "User: " + ((account||{}).username||"nouser") + "\n"
	+ "Kategorie: "+ data.category + "\n"
	+ "Betreff: " + data.subject + "\n"
	+ "Schaue für weitere Details und zur Bearbeitung bitte in den Helpdesk-Bereich der "+ data.cloud +".\n\n"
	+ "Mit freundlichen Grüßen\n"
	+ "Deine " + data.cloud;
}

function createFeedbackText(account, data){
	var ua = UAParser(data.metadata);
	var browser = (ua.browser.version != undefined) ? ua.browser.name + " " + ua.browser.version : ua.browser.name;
	var os = (ua.os.version != undefined) ? ua.os.name + " " + ua.os.version : ua.os.name;
	var device = (ua.device.vendor != undefined) ? ua.device.type + ", " + ua.device.vendor : ua.device.type;
	let text = "User: " + ((account||{}).username||"nouser") + "\n"
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
		// if the ticket is forwarded in helpdesk by admin, the account object is the admin's object and the rest of this is undefined 
		// -> only send this information if it's directly commited from user. maybe later store some of that information in the DB
		if(data.currentUser){
			text = text + "\n \n \n-------------------------- \n \n"
			+ "Browser: " + browser + "\n"
			+ "Betriebssystem: " + os + "\n"
			+ "Gerät: " + device + "\n"
			+ "Aktuelle Rolle: " + data.currentRole + "\n \n"
			+ "Account Object: \n" + JSON.stringify(account) + "\n \n"
			+ "User Object: \n" + JSON.stringify(data.currentUser) + "\n \n"
			+ "School Object: \n" + JSON.stringify(data.currentSchool)
		}
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
						(hook.params.account||{}),
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
						(hook.params.account||{}),
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
