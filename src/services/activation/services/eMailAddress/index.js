const { authenticate } = require('@feathersjs/authentication').hooks;
const { iff, isProvider, disallow } = require('feathers-hooks-common');
const { SC_SHORT_TITLE } = require('../../../../../config/globals');
const logger = require('../../../../logger');

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
	sendMail,
	getUser,
	deleteEntry,
	createEntry,
	setEntryState,
	createActivationLink,
	Mail,
	BadRequest,
	Forbidden,
	GeneralError,
	customErrorMessages,
} = require('../../utils/generalUtils');

const buildActivationLinkMail = (user, entry) => {
	const activationLink = createActivationLink(entry.activationCode);
	const email = entry.quarantinedObject;
	const subject = 'Bestätige deine E-Mail-Adresse';
	const content = {
		text: `Bestätige deine E-Mail-Adresse
\nHallo ${user.firstName},
\nbitte bestätige deine neue E-Mail-Adresse (${email}) über folgenden Link: ${activationLink}
\nBitte beachte, dass der Aktivierungslink nur 2 Stunden gültig ist.
\nDein ${SC_SHORT_TITLE} Team`,
		html: '',
	};

	return new Mail(subject, content, email);
};

const buildFYIMail = (user) => {
	/* eslint-disable max-len */
	const subject = 'E-Mail-Adresse geändert';
	const content = {
		text: `E-Mail-Adresse geändert
\nHallo ${user.firstName},
\nwir wollten dich nur informieren, dass sich die E-Mail-Adresse für dein ${SC_SHORT_TITLE} Konto geändert hat.
\nWenn du die Änderung veranlasst hast, ist alles in Ordnung.
\nFalls du nicht darum gebeten hast, deine E-Mail-Adresse zu änderen, kontaktiere deinen Schuladministrator oder unseren User-Support.
\nDein ${SC_SHORT_TITLE} Team`,
		html: '',
	};

	return new Mail(subject, content, user.email);
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

/** This service takes care of what should happen when an activation
 * code is redeemed, with the keyword eMailAdress. In addition,
 * this service can be used to create an job to change the email/username.
 */
class EMailAddressActivationService {
	/**
	 * create job
	 */
	async create(data, params) {
		if (!data || !data.email || !data.password) throw new BadRequest('Missing information');
		const user = await getUser(this.app, params.account.userId);

		// create new entry
		const entry = await createEntry(this, params.account.userId, E_MAIL_ADDRESS, data.email);

		// send email
		await mail(this, 'activationLinkMail', user, entry);
		return { success: true };
	}

	async update(id, data, params) {
		const { entry, user } = data;
		const account = await this.app.service('/accounts').find({
			query: {
				userId: user._id,
			},
		});
		if ((account || []).length !== 1) throw new Forbidden(customErrorMessages.NOT_AUTHORIZED);

		const email = entry.quarantinedObject;
		if (!email) {
			await deleteEntry(this, entry._id);
			throw new GeneralError('Link incorrectly constructed and will be removed');
		}

		try {
			await setEntryState(this, entry._id, STATE.PENDING);

			// update user and account
			await this.app.service('users').patch(account[0].userId, { email });
			await this.app.service('/accounts').patch(account[0]._id, { username: email });

			// set activation link as consumed
			await setEntryState(this, entry._id, STATE.SUCCESS);
		} catch (error) {
			logger.error(error);
			await setEntryState(this, entry._id, STATE.ERROR);
		}

		// send fyi mail to old email
		await mail(this, 'fyiMail', user, entry);
	}

	setup(app) {
		this.app = app;
	}
}

const EMailAddressActivationHooks = {
	before: {
		all: [authenticate('jwt'), hasPermission(['ACCOUNT_EDIT'])],
		find: [disallow()],
		get: [disallow()],
		create: [
			blockThirdParty,
			validateEmail,
			checkUniqueAccount,
			blockDisposableEmail('email'),
			trimPassword,
			iff(isProvider('external'), validPassword),
		],
		update: [disallow('external')],
		patch: [disallow()],
		remove: [disallow()],
	},
};

module.exports = {
	Hooks: EMailAddressActivationHooks,
	Service: EMailAddressActivationService,
};
