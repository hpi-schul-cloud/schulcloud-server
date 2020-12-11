const { userModel: User } = require('../../../services/user/model');
const { NotFound, GeneralError } = require('../../../errors');

const getUser = async (_id) => {
	const user = await User.findOne({ _id }).lean().exec();
	if (user == null) {
		throw new NotFound('no account for this user');
	}
	return user;
};

const replaceUserWithTombstone = async (id, replaceData = {}) => {
	const replaceResult = await User.replaceOne(
		{ _id: id },
		{
			...replaceData,
			deletedAt: new Date(),
		},
		{ new: true }
	)
		.lean()
		.exec();
	if (replaceResult.n !== 1) {
		throw new NotFound('could not find user to replace with tombstone');
	}
	if (replaceResult.ok !== 1 || replaceResult.nModified !== 1) {
		throw new GeneralError('db error during replacement of user with tombstone');
	}
	return getUser(id);
};

const getUserWithRoles = async (_id) => {
	const user = await User.findOne({
		_id,
	})
		.populate('roles')
		.lean()
		.exec();
	if (user == null) {
		throw new NotFound('no such user');
	}

	return user;
};

module.exports = {
	getUser,
	getUserWithRoles,
	replaceUserWithTombstone,
};
