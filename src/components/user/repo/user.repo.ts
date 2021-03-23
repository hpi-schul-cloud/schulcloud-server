import { userModel as User } from '../../../services/user/model';
import { NotFound, GeneralError } from '../../../errors';

const getUser = async (_id) => {
	const user = await User.findOne({ _id }).lean().exec();
	if (user == null) {
		throw new NotFound('no account for this user');
	}
	return user;
};

const createTombstoneUser = async (schoolId, tombstoneSchoolId) => {
	// no school id so this user does not come up in find schools users
	const user = {
		email: `tombstone-${schoolId.toString()}@hpi-schul-cloud.de`,
		firstName: 'Gelöschter',
		lastName: 'Benutzer',
		schoolId: tombstoneSchoolId,
	};
	return (await User.create(user)).toObject();
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

const getUsersWithRoles = async (_ids) => {
	const users = await User.find({
		_id: { $in: _ids },
	})
		.populate('roles')
		.lean()
		.exec();
	if (users.some((user) => user == null)) {
		throw new NotFound('no such user');
	}

	return users;
};

module.exports = {
	getUser,
	getUserWithRoles,
	getUsersWithRoles,
	replaceUserWithTombstone,
	createTombstoneUser,
};
