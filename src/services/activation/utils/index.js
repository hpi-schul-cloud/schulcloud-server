const {
	Forbidden, NotFound, BadRequest, GeneralError,
} = require('@feathersjs/errors');
const { Configuration } = require('@schul-cloud/commons');
const { HOST } = require('../../../../config/globals');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;
const { getQuarantinedObject, createQuarantinedObject, KEYWORDS } = require('./customUtils');
const { customErrorMessages } = require('../../helpers/utils');
const Mail = require('../services/interface/mailFormat');

/**
 * Object of valid states of entry
 */
const STATE = {
	NOT_STARTED: 'uninitiated',
	PENDING: 'pending',
	SUCCESS: 'success',
	ERROR: 'error',
};

/**
 * Deletes an Entry from db
 * @param {*} ref				this
 * @param {ObjectId} entryId	EntryId of Entry to delete
 * @returns	{Object}			deleted entry
 */
const deleteEntry = async (ref, entryId) => {
	try {
		const res = await (ref.app || ref).service('activationModel').remove({ _id: entryId });
		return res;
	} catch (error) {
		/* eslint-disable-next-line */
		console.error(`Entry could not be removed from the database!`);
		return null;
	}
};

/**
 * Set the state of an entry (job)
 * @param {*} ref 				this
 * @param {ObjectId} entryId	EntryId
 * @param {String} state 		state to set to
 * @returns	{Object}			changed entry
 */
const setEntryState = async (ref, entryId, state) => {
	const entry = await (ref.app || ref).service('activationModel').patch({ _id: entryId }, {
		$set: {
			state,
		},
	});
	return entry;
};

const lookupEntry = (requestingId, entries, keyword) => {
	let filteredEntries = [];
	filteredEntries = entries.filter((entry) => equalIds(entry.userId, requestingId)) || [];
	if (keyword) {
		filteredEntries = filteredEntries.find((entry) => entry.keyword === keyword) || null;
	}
	return filteredEntries;
};

/**
 * Will lookup entries by userId
 * @param {*} ref 					this
 * @param {ObjectId} requestingId	ObjectId of User requesting data
 * @param {String} keyword			Keyword (optional)
 * @returns {Array | Object} 		if a keyword is provided, an object is returned, otherwise an array
 */
const getEntriesByUserId = async (ref, requestingId, keyword = null) => {
	if (!requestingId) throw new Forbidden(customErrorMessages.NOT_AUTHORIZED);

	const entry = await (ref.app || ref).service('activationModel').find({ query: { userId: requestingId } });
	return lookupEntry(requestingId, entry, keyword);
};

/**
 * Will lookup entry by Activation code
 * @param {*} ref 					this
 * @param {ObjectId} requestingId	ObjectId of User requesting data
 * @param {String} activationCode	activationCode
 * @param {String} keyword			Keyword
 * @returns {Object} 				an object is returned
 */
const getEntryByActivationCode = async (ref, requestingId, activationCode, keyword = null) => {
	if (!requestingId) throw new Forbidden(customErrorMessages.NOT_AUTHORIZED);
	if (!activationCode) throw SyntaxError('activationCode required!');

	const entry = await (ref.app || ref).service('activationModel').find({ query: { activationCode } });
	return lookupEntry(requestingId, entry, keyword);
};

/**
 * Checks whether an entry/job is valid, i.e. whether it exists,
 * has not expired or has already been started
 * @param {Object} entry entry/job from db
 */
const validEntry = async (entry) => {
	if (!entry) throw new NotFound(customErrorMessages.ACTIVATION_LINK_INVALID);
	if (
		Date.parse(entry.updatedAt) + 1000 * Configuration.get('ACTIVATION_LINK_PERIOD_OF_VALIDITY_SECONDS')
		< Date.now()
	) {
		await deleteEntry(this, entry._id);
		throw new BadRequest(customErrorMessages.ACTIVATION_LINK_EXPIRED);
	}
	if (entry.state !== STATE.NOT_STARTED && entry.state !== STATE.ERROR) {
		throw new BadRequest(customErrorMessages.ACTIVATION_LINK_INVALID);
	}
};


const createNewEntry = async (ref, userId, keyword, quarantinedObject) => {
	try {
		const entry = await (ref.app || ref).service('activationModel')
			.create({
				userId,
				keyword,
				quarantinedObject,
			});
		return entry;
	} catch (error) {
		throw new Error('Could not create a quarantined object.');
	}
};

/**
 * Create new Entry (job) or returns already existing entry if the quarantinedObject is equal
 * @param {*} ref 					this
 * @param {ObjectId} userId 		UserId
 * @param {String} keyword 			keyword
 * @param {*} quarantinedObject 	quarantinedObject (e.g: email)
 * @returns {Object}				returns newly created Entry
 */
const createEntry = async (ref, userId, keyword, quarantinedObject) => {
	const entry = await getEntriesByUserId(ref, userId, keyword);
	if (entry) {
		if (entry.quarantinedObject === quarantinedObject) {
			return entry;
		}
		await deleteEntry(ref, entry._id);
	}
	const newEntry = await createNewEntry(ref, userId, keyword, quarantinedObject);
	return newEntry;
};


/**
 * Will send email with informatrion from mail {receiver, subject, content}
 * also sets mailSent and updatedAt for entry by entryId
 * @param {*} ref				this
 * @param {Object} mail			{receiver, subject, content}
 * @param {ObjectId} entryId	ObjectId of entry
 */
const sendMail = async (ref, mail, entry) => {
	if (!mail || !mail.receiver || !mail.subject || !mail.content || !entry) throw SyntaxError('missing parameters');

	try {
		await ref.app.service('/mails')
			.create({
				email: mail.receiver,
				subject: mail.subject,
				content: mail.content,
			});

		await ref.app.service('activationModel').patch({ _id: entry._id }, {
			$push: {
				mailSent: Date.now(),
			},
		});
	} catch (error) {
		if (entry.mailSent.length === 0) await deleteEntry(ref, entry._id);
		throw new Error('Can not send mail with activation link');
	}
};

/**
 * Filters a given array of entries. All non validKeys are removed from each object
 * @param {Array} entries	 array of entries
 * @param {*} validKeys 	 array of valid Objectkeys
 * @returns {Array}			 filtered array
 */
const filterEntryParamNames = (entries, validKeys) => {
	if (!Array.isArray(entries)) throw new SyntaxError('entries must be an array');
	(entries || []).forEach((entry) => {
		let data = {};
		Object.keys(entry).forEach((key) => validKeys.includes(key) || delete entry[key]);
		if (validKeys.includes('quarantinedObject')) {
			data = entry.quarantinedObject;
			delete entry.quarantinedObject;
			entry.data = data;
		}
	});
	return entries;
};

/**
 * Returns a User with given userId
 * @param {*} ref 				this
 * @param {ObjectId} userId 	UserId
 * @param {*} req				requestParams (optional)
 * @returns {Object}			user object
 */
const getUser = async (ref, userId, req = null) => {
	if (req && req.params.user) {
		return req.params.user;
	}
	const user = await (ref.app || ref).service('users').get(userId);
	return user;
};

/**
 * Creates an activationLink
 * @param {String} activationCode	activationCode from entry
 * @returns {String}				activationLink
 */
const createActivationLink = (activationCode) => `${HOST}/activation/${activationCode}`;

module.exports = {
	STATE,
	KEYWORDS,
	getEntriesByUserId,
	getEntryByActivationCode,
	setEntryState,
	sendMail,
	getUser,
	getQuarantinedObject,
	createQuarantinedObject,
	createEntry,
	deleteEntry,
	validEntry,
	createActivationLink,
	Mail,
	filterEntryParamNames,
	Forbidden,
	NotFound,
	BadRequest,
	GeneralError,
	customErrorMessages,
};
