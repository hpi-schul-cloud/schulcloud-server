const { authenticate } = require('@feathersjs/authentication').hooks;
const { iff, isProvider } = require('feathers-hooks-common');
const { BadRequest, Forbidden, NotFound } = require('@feathersjs/errors');
const { SC_SHORT_TITLE, HOST } = require('../../../../config/globals');

const {
	validPassword,
	blockThirdParty,
	sanitizeData,
	blockDisposableEmail,
	trimPassword,
	hasPermission,
} = require('../hooks/utils');

const {
	KEYWORDS,
	lookupByEntryId,
	lookupByUserId,
	sendMail,
	getUser,
	deleteEntry,
	createQuarantinedObject,
	getQuarantinedObject,
} = require('../utils');

const buildMail = (user, activationLink) => {
	const subject = 'Bestätige deine E-Mail-Adresse';
	const content = {
		text: `Einladung in die ${SC_SHORT_TITLE}
Hallo ${user.firstName},
\\nDu wurdest eingeladen, der ${SC_SHORT_TITLE} beizutreten,
\\nbitte vervollständige deine Registrierung unter folgendem Link: ${activationLink}
\\nViel Spaß und einen guten Start wünscht dir dein ${SC_SHORT_TITLE}-Team`,
		html: '',
	};

	return {
		email: user.email,
		subject,
		content,
	};
};

const keyword = KEYWORDS.E_MAIL_ADDRESS;

class EMailAdresseActivationService {
	async find(params) {
		const { userId } = params.authentication.payload;
		const entry = await lookupByUserId(this, userId, userId, keyword);
		if (entry) {
			const email = getQuarantinedObject(keyword, entry.quarantinedObject);
			return {
				keyword: entry.keyword,
				email,
			};
		}
		return {};
	}

	async create(data, params) {
		if (!data || !data.email || !data.password) throw new BadRequest('Missing information');
		const user = await getUser(this, params.account.userId);

		// check if entry already exists
		let entry;
		entry = await lookupByUserId(this, user._id, params.account.userId, keyword);
		if (entry) {
			// create new entry when email changed
			const email = getQuarantinedObject(keyword, entry.quarantinedObject);
			if (email !== data.email) {
				await deleteEntry(this, entry._id);
				entry = undefined;
			} else {
				// resend email
				const link = `${HOST}/activation/email/${entry._id}`;
				const mail = buildMail(user, link);
				await sendMail(this, mail, entry);
				return;
			}
		}

		// create new entry
		const quarantinedObject = createQuarantinedObject(keyword, data.email);
		try {
			entry = await this.app.service('activationModel')
				.create({
					account: params.account.userId,
					keyword,
					quarantinedObject,
				});
		} catch (error) {
			throw new Error('Could not create a quarantined object.');
		}

		// send email
		const link = `${HOST}/activation/email/${entry._id}`;
		const mail = buildMail(user, link);
		await sendMail(this, mail, entry);
	}

	async update(id, data, params) {
		if (!id) throw new NotFound('activation link invalid');
		const user = await getUser(this, params.account.userId);
		const entry = await lookupByEntryId(this, user._id, id, keyword);

		if (!user) throw new NotFound('activation link invalid');
		if (!entry) throw new NotFound('activation link invalid');
		if (Date.parse(entry.updatedAt) + 1000 * 60 * 60 * 2 < Date.now()) {
			await deleteEntry(this, entry._id);
			throw new BadRequest('activation link expired');
		}
		if (!entry.valid) {
			await deleteEntry(this, entry._id);
			throw new BadRequest('activation link invalid');
		}

		const account = await this.app.service('/accounts').find({
			query: {
				userId: params.account.userId,
			},
		});
		if ((account || []).length !== 1) throw new Forbidden('Not authorized');

		const email = getQuarantinedObject(keyword, entry.quarantinedObject);
		if (!email || !(email instanceof String)) {
			await deleteEntry(this, entry._id);
			throw new Error('Link incorrectly constructed and will be removed');
		}

		// update user and account
		await this.app.service('users').patch(account[0].userId, { email });
		await this.app.service('/accounts').patch(account[0]._id, { username: email });

		// set activation link as consumed
		await this.app.service('activationModel').update({ _id: entry._id }, {
			$set: {
				valid: false,
			},
		});

		// delete entry
		await deleteEntry(this, entry._id);
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
			sanitizeData,
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
