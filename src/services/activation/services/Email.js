const { authenticate } = require('@feathersjs/authentication').hooks;
const { iff, isProvider } = require('feathers-hooks-common');
const { BadRequest, Forbidden, NotFound } = require('@feathersjs/errors');
const { Configuration } = require('@schul-cloud/commons');
const { SC_SHORT_TITLE, HOST } = require('../../../../config/globals');

const ttl = Configuration.get('ACTIVATION_LINK_PERIOD_OF_VALIDITY');

const {
	validPassword,
	blockThirdParty,
	validateEmail,
	blockDisposableEmail,
	trimPassword,
	hasPermission,
} = require('../hooks/utils');

const {
	STATE,
	KEYWORDS,
	lookupByActivationCode,
	lookupByUserId,
	sendMail,
	getUser,
	deleteEntry,
	createEntry,
	getQuarantinedObject,
	Mail,
} = require('../utils');

const buildActivationLinkMail = (user, entry) => {
	const activationLink = `${HOST}/activation/email/${entry.activationCode}`;
	const email = getQuarantinedObject(entry.keyword, entry.quarantinedObject);
	const subject = 'Bestätige deine E-Mail-Adresse';
	const content = {
		text: `Bestätige deine E-Mail-Adresse
\\nHallo ${user.firstName},
\\nbitte bestätige deine neue E-Mail-Adresse über folgenden Link: ${activationLink}
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

const keyword = KEYWORDS.E_MAIL_ADDRESS;

class EMailAdresseActivationService {
	async find(params) {
		const { userId } = params.authentication.payload;
		const entry = await lookupByUserId(this, userId, keyword);
		if (entry) {
			const email = getQuarantinedObject(keyword, entry.quarantinedObject);
			return {
				success: true,
				keyword: entry.keyword,
				email,
			};
		}
		return { success: true };
	}

	async create(data, params) {
		if (!data || !data.email || !data.password) throw new BadRequest('Missing information');
		const user = await getUser(this, params.account.userId);

		// check if entry already exists
		let entry;
		entry = await lookupByUserId(this, params.account.userId, keyword);
		if (entry) {
			const email = getQuarantinedObject(keyword, entry.quarantinedObject);
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
		entry = await createEntry(this, params.account.userId, keyword, data.email);

		// send email
		await mail(this, 'activationLinkMail', user, entry);
		return { success: true };
	}

	async update(id, data, params) {
		if (!id) throw new NotFound('activation link invalid');
		const user = await getUser(this, params.account.userId);
		const entry = await lookupByActivationCode(this, user._id, id, keyword);

		if (!user) throw new NotFound('activation link invalid');
		if (!entry) throw new NotFound('activation link invalid');
		if (Date.parse(entry.updatedAt) + 1000 * ttl < Date.now()) {
			await deleteEntry(this, entry._id);
			throw new BadRequest('activation link expired');
		}
		if (entry.state !== STATE.notStarted) {
			throw new BadRequest('activation link invalid');
		}

		const account = await this.app.service('/accounts').find({
			query: {
				userId: params.account.userId,
			},
		});
		if ((account || []).length !== 1) throw new Forbidden('Not authorized');

		const email = getQuarantinedObject(keyword, entry.quarantinedObject);
		if (!email) {
			await deleteEntry(this, entry._id);
			throw new Error('Link incorrectly constructed and will be removed');
		}

		// update user and account
		await this.app.service('users').patch(account[0].userId, { email });
		await this.app.service('/accounts').patch(account[0]._id, { username: email });

		// set activation link as consumed
		await this.app.service('activationModel').patch({ _id: entry._id }, {
			$set: {
				activated: true,
			},
		});

		// send fyi mail to old email
		await mail(this, 'fyiMail', user, entry);

		// delete entry
		await deleteEntry(this, entry._id);
		return { success: true };
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
			blockDisposableEmail('email'),
			trimPassword,
			iff(isProvider('external'), validPassword),
		],
		update: [],
		patch: [],
		remove: [],
	},
};

module.exports = {
	Hooks: EMailAdresseActivationHooks,
	Service: EMailAdresseActivationService,
};
