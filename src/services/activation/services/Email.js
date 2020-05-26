const { authenticate } = require('@feathersjs/authentication').hooks;
const { BadRequest, Forbidden } = require('@feathersjs/errors');
const { hasPermission } = require('../../../hooks');
const { SC_SHORT_TITLE, HOST } = require('../../../../config/globals');
const {
	KEYWORDS,
	lookup,
	sendMail,
	getUser,
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

class EMailAdresseActivationService {
	async create(data, params) {
		let entry;

		const user = await getUser(this, params.account.userId);

		// check password

		// check if entry already exists
		entry = await lookup(this, params.account.userId, undefined, KEYWORDS.E_MAIL_ADDRESS);
		if (entry) {
			// resend email
			const link = `${HOST}/activation/email/${entry._id}`;
			const mail = buildMail(user, link);
			await sendMail(this, mail, entry._id);
			return;
		}

		// create new entry
		try {
			entry = await this.app.service('activationModel')
				.create({
					account: params.account.userId,
					keyword: KEYWORDS.E_MAIL_ADDRESS,
					quarantinedObject: { email: 'lehrer@schul-cloud.com' },
				});
		} catch (error) {
			throw new Error('Could not create a quarantined object.');
		}

		// send email
		const link = `${HOST}/activation/email/${entry._id}`;
		const mail = buildMail(user, link);
		await sendMail(this, mail, entry._id);
	}

	async update(id, data, params) {
		if (!id) throw new BadRequest('activation link invalid');
		const entry = await lookup(this, undefined, id, KEYWORDS.E_MAIL_ADDRESS);
		const user = await getUser(this, params.account.userId);

		if (!user) throw new BadRequest('activation link invalid');
		if (!entry) throw new BadRequest('activation link invalid');
		if (entry.account.toString() !== user._id.toString()) throw new Forbidden('Not allowed');
		if (Date.parse(entry.updatedAt) + 1000 * 60 * 60 * 2 < Date.now()) {
			await this.app.service('activationModel').remove({ _id: entry._id });
			throw new BadRequest('activation link expired');
		}

		const account = await this.app.service('/accounts').find({
			query: {
				userId: params.account.userId,
			},
		});
		if ((account || []).length !== 1) throw new Forbidden('Not allowed');
		if (!entry.quarantinedObject.email || entry.quarantinedObject.email instanceof String) {
			await this.app.service('activationModel').remove({ _id: entry._id });
			throw new Error('Link incorrectly constructed and will be removed');
		}

		// update user and account
		await this.app.service('users').patch(account[0].userId, { email: entry.quarantinedObject.email });
		await this.app.service('/accounts').patch(account[0]._id, { username: entry.quarantinedObject.email });

		// delete entry
		await this.app.service('activationModel').remove({ _id: entry._id });
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
	},
};

module.exports = {
	Hooks: EMailAdresseActivationHooks,
	Service: EMailAdresseActivationService,
};
