const { authenticate } = require('@feathersjs/authentication').hooks;
const { iff, isProvider, disallow } = require('feathers-hooks-common');
const { SC_SHORT_TITLE } = require('../../../../../config/globals');

const {
	validPassword,
	blockThirdParty,
	validateEmail,
	blockDisposableEmail,
	trimPassword,
	hasPermission,
	checkUniqueAccount,
} = require('../../hooks/utils');

const {
	STATE,
	KEYWORDS: { E_MAIL_ADDRESS },
	lookupByUserId,
	sendMail,
	getUser,
	deleteEntry,
	createEntry,
	setEntryState,
	getQuarantinedObject,
	createActivationLink,
	Mail,
	BadRequest,
	Forbidden,
	GeneralError,
} = require('../../utils');

const buildActivationLinkMail = (user, entry) => {
	const activationLink = createActivationLink(entry.activationCode);
	const email = getQuarantinedObject(entry.keyword, entry.quarantinedObject);
	const subject = 'Bestätige deine E-Mail-Adresse';
	const content = {
		text: `Bestätige deine E-Mail-Adresse
\\nHallo ${user.firstName},
\\nbitte bestätige deine neue E-Mail-Adresse (${email}) über folgenden Link: ${activationLink}
\\nBitte beachte, dass der Aktivierungslink nur 2 Stunden gültig ist.
\\nDein ${SC_SHORT_TITLE} Team`,
		html: '',
	};

	return new Mail(subject, content, email).getMail;
};

const buildFYIMail = (user) => {
	/* eslint-disable max-len */
	const subject = 'E-Mail-Adresse geändert';
	const content = {
		text: `E-Mail-Adresse geändert
\\nHallo ${user.firstName},
\\nwir wollten dich nur informieren, dass sich die E-Mail-Adresse für dein ${SC_SHORT_TITLE} Konto geändert hat.
\\nWenn du die Änderung veranlasst hast, ist alles in Ordnung.
\\nFalls du nicht darum gebeten hast, deine E-Mail-Adresse zu änderen, kontaktiere deinen Schuladministrator oder unseren User-Support.
\\nDein ${SC_SHORT_TITLE} Team`,
		html: '',
	};

	return new Mail(subject, content, user.email).getMail;
};

const mail = async (ref, type, user, entry) => {
	let content;
	switch (type) {
		case 'activationLinkMail':
			content = buildActivationLinkMail(user, entry);
			break;

		case 'fyiMail':
			content = buildFYIMail(user);
			break;

		default:
			throw new Error('Mail type not defined');
	}

	await sendMail(ref, content, entry);
};

class EMailAdresseActivationService {
	// async find(params) {
	// 	const { userId } = params.authentication.payload;
	// 	const entry = await lookupByUserId(this, userId, E_MAIL_ADDRESS);
	// 	if (entry) {
	// 		const user = await getUser(this, userId);
	// 		await mail(this, 'activationLinkMail', user, entry);
	// 	}
	// 	return { success: true };
	// }

	async create(data, params) {
		if (!data || !data.email || !data.password) throw new BadRequest('Missing information');
		const user = await getUser(this, params.account.userId);

		// check if entry already exists
		let entry;
		entry = await lookupByUserId(this, params.account.userId, E_MAIL_ADDRESS);
		if (entry) {
			const email = getQuarantinedObject(E_MAIL_ADDRESS, entry.quarantinedObject);
			if (email !== data.email) {
				// create new entry when email changed
				await deleteEntry(this, entry._id);
				entry = undefined;
			} else {
				// resend email
				await mail(this, 'activationLinkMail', user, entry);
				return { success: true };
			}
		}

		// create new entry
		entry = await createEntry(this, params.account.userId, E_MAIL_ADDRESS, data.email);

		// send email
		await mail(this, 'activationLinkMail', user, entry);
		return { success: true };
	}

	async update(id, data, params) {
		const { entry, user } = data;
		const account = await this.app.service('/accounts').find({
			query: {
				userId: params.account.userId,
			},
		});
		if ((account || []).length !== 1) throw new Forbidden('Not authorized');

		const email = getQuarantinedObject(E_MAIL_ADDRESS, entry.quarantinedObject);
		if (!email) {
			await deleteEntry(this, entry._id);
			throw new GeneralError('Link incorrectly constructed and will be removed');
		}

		try {
			await setEntryState(this, entry._id, STATE.pending);

			// update user and account
			await this.app.service('users').patch(account[0].userId, { email });
			await this.app.service('/accounts').patch(account[0]._id, { username: email });

			// set activation link as consumed
			await setEntryState(this, entry._id, STATE.success);
		} catch (error) {
			await setEntryState(this, entry._id, STATE.error);
		}

		// send fyi mail to old email
		await mail(this, 'fyiMail', user, entry);
	}

	setup(app) {
		this.app = app;
	}
}

const EMailAdresseActivationHooks = {
	before: {
		all: [
			authenticate('jwt'),
			hasPermission(['ACCOUNT_EDIT']),
		],
		find: [],
		get: [],
		create: [
			blockThirdParty,
			validateEmail,
			checkUniqueAccount,
			blockDisposableEmail('email'),
			trimPassword,
			iff(isProvider('external'), validPassword),
		],
		update: [disallow('external')],
		patch: [],
		remove: [],
	},
};

module.exports = {
	Hooks: EMailAdresseActivationHooks,
	Service: EMailAdresseActivationService,
};
