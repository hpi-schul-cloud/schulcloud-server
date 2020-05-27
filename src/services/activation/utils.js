const { Forbidden } = require('@feathersjs/errors');
const { equal: equalIds } = require('../../helper/compare').ObjectId;

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

const deleteEntry = async (ref, entryId) => {
	try {
		await ref.app.service('activationModel').remove({ _id: entryId });
	} catch (error) {
		/* eslint-disable-next-line */
		console.error(`Entry (${entryId}) could not be removed from the database!`);
	}
};

const lookupEntry = (requestingId, entry, keyword) => {
	if ((entry || []).length === 1 && entry[0].keyword === keyword) {
		if (!equalIds(entry[0].account, requestingId)) throw new Forbidden('Not authorized');
		return entry[0];
	}
	return null;
};

/**
 * Will lookup entry in a activation by userId
 * @param {*} ref 					this
 * @param {ObjectId} requestingId	ObjectId of User requesting data
 * @param {ObjectId} userId			ObjectId of User (userId)
 * @param {String} keyword			Keyword
 */
const lookupByUserId = async (ref, requestingId, userId, keyword) => {
	if (!requestingId) throw new Forbidden('Not authorized');
	if (!userId) throw SyntaxError('userId required!');
	if (!keyword) throw SyntaxError('keyword required!');

	const entry = await ref.app.service('activationModel').find({ query: { account: userId } });
	return lookupEntry(requestingId, entry, keyword);
};

/**
 * Will lookup entry in a activation by entryId
 * @param {*} ref 					this
 * @param {ObjectId} requestingId	ObjectId of User requesting data
 * @param {ObjectId} entryId		ObjectId of entry
 * @param {String} keyword			Keyword
 */
const lookupByEntryId = async (ref, requestingId, entryId, keyword) => {
	if (!requestingId) throw new Forbidden('Not authorized');
	if (!entryId) throw SyntaxError('entryId required!');
	if (!keyword) throw SyntaxError('keyword required!');

	const entry = await ref.app.service('activationModel').find({ query: { _id: entryId } });
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

		await ref.app.service('activationModel').update({ _id: entry._id }, {
			$set: {
				updatedAt: Date.now(),
				mailSend: true,
			},
		});
	} catch (error) {
		if (!entry.mailSend) deleteEntry(ref, entry._id);
		throw new Error('Can not send mail with activation link');
	}
};

const getUser = async (ref, userId) => {
	const user = await ref.app.service('users').get(userId);
	return user;
};

module.exports = {
	KEYWORDS,
	lookupByUserId,
	lookupByEntryId,
	sendMail,
	getUser,
	deleteEntry,
	createQuarantinedObject,
	getQuarantinedObject,
};
