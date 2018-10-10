'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

function createinfoText(user, category, subject, cloud){
	return "Ein neues Problem wurde gemeldet." + "\n"
	+ "User: " + user + "\n"
	+ "Kategorie: "+ category + "\n"
	+ "Betreff: " + subject + "\n"
	+ "Schaue für weitere Details und zur Bearbeitung bitte in den Helpdesk-Bereich der "+ cloud +".\n\n"
	+ "Mit freundlichen Grüßen\n"
	+ "Deine " + cloud;
}

function createfeedbackText(user, category, email, schoolName, subject, content){
	let text = "User: " + user + "\n"
	+ "E-Mail: " + email + "\n"
	+ "Schule: " + schoolName + "\n"
	+ "Bereich ausgewählt: " + category + "\n";
	if (content.desire != ""){
		text = text + "User schrieb folgendes: \n"
		+ "Als " + content.role + "\n" 
        + "möchte ich " + content.desire + ",\n" 
        + "um " + content.benefit + ".\n" 
    	+ "Akzeptanzkriterien: " + content.acceptanceCriteria;
	} else {
		text = text + "User meldet folgendes: \n"
		+ "Problem Kurzbeschreibung: " + subject + "\n" +
		"IST-Zustand: " + content.currentState + "\n" +
		"SOLL-Zustand: " + content.targetState;
	}
	return text;
}

const problemOrFeedback = hook => {
	if (hook.data.type === "feedback"){
		hook.result = {}; //interrupts db interaction
	}
	return hook;
}

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [globalHooks.hasPermission('HELPDESK_VIEW')],
	get: [globalHooks.hasPermission('HELPDESK_VIEW')],
	create: [globalHooks.hasPermission('HELPDESK_CREATE'), restrictToCurrentSchool, problemOrFeedback],
	update: [globalHooks.hasPermission('HELPDESK_EDIT'), restrictToCurrentSchool],
	patch: [globalHooks.hasPermission('HELPDESK_EDIT'),globalHooks.permitGroupOperation, restrictToCurrentSchool],
	remove: [globalHooks.hasPermission('HELPDESK_CREATE'),globalHooks.permitGroupOperation, globalHooks.ifNotLocal(globalHooks.checkSchoolOwnership)]
};

const feedback = () => {
	return hook=>{
		const data=hook.data||{};
		if (data.type === "problem"){ // case: admin
			globalHooks.sendEmail(hook, {
				"subject": "Ein Problem wurde gemeldet.",
				"roles": ["helpdesk", "administrator"],
				"content": {
					"text": createinfoText(
						(hook.params.account||{}).username||"nouser",
						data.category||"nocategory",
						data.subject||"nosubject",
						data.cloud||"Schul-Cloud")
				}
			});
			/* //NOTIFICATION SERVICE IS BEING RENEWED
			let userservice = hook.app.service('/users');
			userservice.find({query: {roles: ['helpdesk']}})
			.then(userdata => {
				userdata.data.map(user => {
					if (process.env.NOTIFICATION_SERVICE_ENABLED) {
						let notificationservice = hook.app.service('/notification/messages');
						notificationservice.post({
							json: {
								"title": "Ein neues Problem wurde gemeldet.",
								"body": "",
								"token": user._id,
								"priority": "high",
								"action": //URL vom client mitschicken, im debug nochmal gucken obs im hook ist`/administration/helpdesk`,
								"scopeIds": [
									user._id
								]
							}
						});
					}
				});
			})
			.catch(error => {
				let e = error;
			});
			*/
		} else { // case: schulcloud feedback
			globalHooks.sendEmail(hook, {
				"subject": data.subject||"nosubject",
				"emails": ["ticketsystem@schul-cloud.org"],
				"content": {
					"text": createfeedbackText(
						(hook.params.account||{}).username||"nouser",
						data.category||"nocategory",
						data.email||"noemail",
						data.schoolName||"noschoolname",
						data.subject||"",
            			data.content)
				}
			});
		}
		return Promise.resolve(hook);
	}
 }

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [feedback()],
	update: [],
	patch: [],
	remove: []
}