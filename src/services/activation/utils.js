const KEYWORDS = {
	E_MAIL_ADDRESS: 'eMailAddress',
};

/**
 * Will lookup entry in a activation by userId or entryId
 * @param {*} ref 				this
 * @param {ObjectId} userId		ObjectId of User (userId)
 * @param {ObjectId} entryId	ObjectId of entry
 * @param {String} keyword		Keyword
 */
const lookup = async (ref, userId, entryId, keyword) => {
	let entry;
	if (userId) {
		entry = await ref.app.service('activationModel').find({ query: { account: userId } });
	} else if (entryId) {
		entry = await ref.app.service('activationModel').find({ query: { _id: entryId } });
	} else {
		throw SyntaxError('userId or entryId required!');
	}

	if ((entry || []).length === 1 && entry[0].keyword === keyword) {
		return entry[0];
	}
	return null;
};

/**
 * Will send email with informatrion from mail {email, subject, content}
 * also sets mailSend and updatedAt for entry by entryId
 * @param {*} ref				this
 * @param {Object} mail			{email, subject, content}
 * @param {ObjectId} entryId	ObjectId of entry
 */
const sendMail = async (ref, mail, entryId) => {
	if (!mail || !mail.email || !mail.subject || !mail.content || !entryId) throw SyntaxError('missing parameters');
	await ref.app.service('/mails')
		.create({
			email: mail.email,
			subject: mail.subject,
			content: mail.content,
		});

	await ref.app.service('activationModel').update({ _id: entryId }, {
		$set: {
			updatedAt: Date.now(),
			mailSend: true,
		},
	});
};

const getUser = async (ref, userId) => {
	const user = await ref.app.service('users').get(userId);
	return user;
};

const deleteEntry = async (ref, entryId) => {

};

module.exports = {
	KEYWORDS,
	lookup,
	sendMail,
	getUser,
};
