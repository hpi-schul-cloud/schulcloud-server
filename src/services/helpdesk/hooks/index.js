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
	+ "Schauen Sie für weitere Details und zur Bearbeitung bitte in den Helpdesk-Bereich der "+ cloud +".\n\n"
	+ "Mit freundlichen Grüßen\n"
	+ "Deine " + cloud;
}

function createfeedbackText(user, category, email, schoolName, text){
	return "User: " + user + "\n"
	+ "E-Mail: " + email + "\n"
	+ "Schule: " + schoolName + "\n"
	+ "Bereich ausgewählt: " + category + "\n"
	+ "User schrieb folgendes: \n" + text
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
								"action": `${(req.headers.origin || process.env.HOST)}/administration/helpdesk`,
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
						data.text||"notext")
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
};
