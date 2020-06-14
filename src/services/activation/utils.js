const { Forbidden, NotFound, BadRequest } = require('@feathersjs/errors');
const { Configuration } = require('@schul-cloud/commons');
const crypto = require('crypto');
const { equal: equalIds } = require('../../helper/compare').ObjectId;
const Mail = require('./mail');

const STATE = {
	notStarted: 'uninitiated',
	pending: 'pending',
	success: 'success',
	error: 'error',
};

const KEYWORDS = {
	E_MAIL_ADDRESS: 'eMailAddress',
};

const createQuarantinedObject = (keyword, payload) => {
	switch (keyword) {
		case KEYWORDS.E_MAIL_ADDRESS:
			return {
				email: payload,
			};

		default:
			throw new Error(`No pattern defined for ${keyword}`);
	}
};

const getQuarantinedObject = (keyword, quarantinedObject) => {
	switch (keyword) {
		case KEYWORDS.E_MAIL_ADDRESS:
			return quarantinedObject.email;

		default:
			throw new Error(`No dissolution defined for ${keyword}`);
	}
};

const createEntry = async (ref, account, keyword, data) => {
	try {
		const quarantinedObject = createQuarantinedObject(keyword, data);
		const activationCode = crypto.randomBytes(64).toString('hex');
		const entry = await (ref.app ? ref.app : ref).service('activationModel')
			.create({
				activationCode,
				account,
				keyword,
				quarantinedObject,
			});
		return entry;
	} catch (error) {
		throw new Error('Could not create a quarantined object.');
	}
};

const deleteEntry = async (ref, entryId) => {
	try {
		await ref.app.service('activationModel').remove({ _id: entryId });
	} catch (error) {
		/* eslint-disable-next-line */
		console.error(`Entry could not be removed from the database!`);
	}
};

const lookupEntry = (requestingId, entries, keyword) => {
	let filteredEntries = [];
	filteredEntries = entries.filter((entry) => equalIds(entry.account, requestingId)) || [];
	if (keyword) {
		filteredEntries = filteredEntries.find((entry) => entry.keyword === keyword) || null;
	}
	return filteredEntries;
};

const validEntry = async (entry) => {
	if (!entry) throw new NotFound('activation link invalid');
	if (
		Date.parse(entry.updatedAt) + 1000 * Configuration.get('ACTIVATION_LINK_PERIOD_OF_VALIDITY_SECONDS')
		< Date.now()
	) {
		await deleteEntry(this, entry._id);
		throw new BadRequest('activation link expired');
	}
	if (entry.state !== STATE.notStarted) {
		throw new BadRequest('activation link invalid');
	}
};

/**
 * Will lookup entry in a activation by userId
 * @param {*} ref 					this
 * @param {ObjectId} requestingId	ObjectId of User requesting data
 * @param {ObjectId} userId			ObjectId of User (userId)
 * @param {String} keyword			Keyword
 */
const lookupByUserId = async (ref, requestingId, keyword = null) => {
	if (!requestingId) throw new Forbidden('Not authorized');

	const entry = await (ref.app || ref).service('activationModel').find({ query: { account: requestingId } });
	return lookupEntry(requestingId, entry, keyword);
};

/**
 * Will lookup entry in a activation by entryId
 * @param {*} ref 					this
 * @param {ObjectId} requestingId	ObjectId of User requesting data
 * @param {String} activationCode	activationCode
 * @param {String} keyword			Keyword
 */
const lookupByActivationCode = async (ref, requestingId, activationCode, keyword = null) => {
	if (!requestingId) throw new Forbidden('Not authorized');
	if (!activationCode) throw SyntaxError('entryId required!');

	const entry = await (ref.app || ref).service('activationModel').find({ query: { activationCode } });
	return lookupEntry(requestingId, entry, keyword);
};

/**
 * Will send email with informatrion from mail {email, subject, content}
 * also sets mailSend and updatedAt for entry by entryId
 * @param {*} ref				this
 * @param {Object} mail			{email, subject, content}
 * @param {ObjectId} entryId	ObjectId of entry
 */
const sendMail = async (ref, mail, entry) => {
	if (!mail || !mail.email || !mail.subject || !mail.content || !entry) throw SyntaxError('missing parameters');

	try {
		await ref.app.service('/mails')
			.create({
				email: mail.email,
				subject: mail.subject,
				content: mail.content,
			});

		await ref.app.service('activationModel').patch({ _id: entry._id }, {
			$set: {
				mailSend: true,
			},
		});
	} catch (error) {
		if (!entry.mailSend) deleteEntry(ref, entry._id);
		throw new Error('Can not send mail with activation link');
	}
};

const sanitizeEntries = (enties, validKeys) => {
	(enties || []).forEach((entry) => {
		let data = {};
		if ('quarantinedObject' in entry) {
			data = getQuarantinedObject(entry.keyword, entry.quarantinedObject);
			delete entry.quarantinedObject;
		}
		Object.keys(entry).forEach((key) => validKeys.includes(key) || delete entry[key]);
		entry.data = data;
	});
	return enties;
};

const getUser = async (ref, userId) => {
	const user = await ref.app.service('users').get(userId);
	return user;
};

module.exports = {
	STATE,
	KEYWORDS,
	lookupByUserId,
	lookupByActivationCode,
	sendMail,
	getUser,
	getQuarantinedObject,
	createEntry,
	deleteEntry,
	validEntry,
	Mail,
	sanitizeEntries,
};
