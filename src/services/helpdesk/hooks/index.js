const { authenticate } = require('@feathersjs/authentication');
const { Configuration } = require('@hpi-schul-cloud/commons');
const globalHooks = require('../../../hooks');

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

function createInfoText(user, data) {
	return `
Ein neues Problem wurde gemeldet.
User: ${user}
Betreff: ${data.subject}
Schaue für weitere Details und zur Bearbeitung bitte in den Helpdesk-Bereich der ${data.cloud}.\n
Mit freundlichen Grüßen
Deine ${data.cloud}
	`;
}

async function generateSystemInformation(hook) {
	const { userId, username } = hook.params.account;
	const userInformation = await hook.app.service('users').get(userId, {
		query: {
			$populate: { path: 'roles' },
		},
	});

	const roles = userInformation.roles.length ? userInformation.roles.map((info) => info.name) : 'NO ROLE(S)';
	const email = userInformation.email || 'NO EMAIL';
	const systemInformation = `
	User login: ${username}
	User role(s): ${roles}
	User registrated email: ${email}\n`;
	return systemInformation;
}

function createFeedbackText(user, data = {}) {
	const device = data.deviceUserAgent ? `${data.device} [auto-detection: ${data.deviceUserAgent}]` : data.device;
	let text = `
SystemInformation: ${data.systemInformation}
ReplyEmail: ${data.replyEmail}
User: ${user}
User-ID: ${data.userId}
Schule: ${data.schoolName}
Schule-ID: ${data.schoolId}
Instanz: ${data.cloud}
Browser: ${data.browserName}
Browser Version: ${data.browserVersion}
Betriebssystem: ${data.os}
Gerät: ${device}
`;

	if (data.desire && data.desire !== '') {
		text = `
${text}
User schrieb folgendes:
Als ${data.role}
möchte ich ${data.desire},
um ${data.benefit}.
Akzeptanzkriterien: ${data.acceptanceCriteria}
`;
	} else {
		text = `
${text}
User meldet folgendes:
Problembereich: ${data.problemArea}
Problem Kurzbeschreibung: ${data.subject}
Problembeschreibung: ${data.problemDescription}
`;
		if (data.notes) {
			text = `
${text}
Anmerkungen: ${data.notes}
`;
		}
	}
	return text;
}

const denyDbWriteOnType = (hook) => {
	if (hook.data.type === 'contactHPI') {
		hook.result = {}; // interrupts db interaction
	}
	return hook;
};

const feedback = () => async (hook) => {
	const data = hook.data || {};
	if (data.type === 'contactAdmin') {
		globalHooks.sendEmail(hook, {
			subject: 'Ein Problem wurde gemeldet.',
			roles: ['helpdesk', 'administrator'],
			content: {
				text: createInfoText((hook.params.account || {}).username || 'nouser', data),
			},
			attachments: data.files,
		});
		// TODO: NOTIFICATION SERVICE
	} else {
		data.systemInformation = await generateSystemInformation(hook);
		const emails = [];
		if (data.supportType) {
			if (data.supportType === 'problem') {
				emails.push(Configuration.get('SUPPORT_PROBLEM_EMAIL_ADDRESS'));
			} else {
				emails.push(Configuration.get('SUPPORT_WISH_EMAIL_ADDRESS'));
			}
		} else {
			emails.push(Configuration.get('SUPPORT_PROBLEM_EMAIL_ADDRESS'));
		}
		globalHooks.sendEmail(hook, {
			subject: data.title || data.subject || 'nosubject',
			emails,
			replyEmail: data.replyEmail,
			content: {
				text: createFeedbackText((hook.params.account || {}).username || 'nouser', data),
			},
			attachments: data.files,
		});
	}
	return Promise.resolve(hook);
};

exports.before = {
	all: [authenticate('jwt')],
	find: [globalHooks.hasPermission('HELPDESK_VIEW')],
	get: [globalHooks.hasPermission('HELPDESK_VIEW')],
	create: [globalHooks.hasPermission('HELPDESK_CREATE'), restrictToCurrentSchool, denyDbWriteOnType],
	update: [globalHooks.hasPermission('HELPDESK_EDIT'), restrictToCurrentSchool],
	patch: [globalHooks.hasPermission('HELPDESK_EDIT'), globalHooks.permitGroupOperation, restrictToCurrentSchool],
	remove: [
		globalHooks.hasPermission('HELPDESK_CREATE'),
		globalHooks.permitGroupOperation,
		globalHooks.ifNotLocal(globalHooks.checkSchoolOwnership),
	],
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [feedback()],
	update: [],
	patch: [],
	remove: [],
};
