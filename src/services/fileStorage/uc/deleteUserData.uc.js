const reqlib = require('app-root-path').require;

const { Unprocessable } = reqlib('src/errors');

const repo = require('../repo/files.repo');

/**
 * Delete file connections for files shared with user
 * @param {BSON || BSONString} userId
 */
const findSharedFilesWithUserId = async (userId) => {
	try {
		const result = await repo.findFilesShardWithUser(userId);
		// format
		// null is valid response but should formated to array
		return result;
	} catch (err) {
		throw new Unprocessable('Can not execute find shared files.', err);
	}
};

const deleteUserData = async (userId) => {
	const context = {
		context: 'files',
		data: [],
		errros: [],
	};

	const results = await Promise.allSettled([findSharedFilesWithUserId(userId)]);

	results.forEach(({ status, value, reason }) => {
		if (status === 'rejected') {
			context.errros.push(reason);
		} else {
			// fulfilled
			context.data = [...context.data, ...value];
		}
	});

	try {
		const ids = context.data.map(({ _id }) => _id);

		await repo.deleteFilesByIDs(ids);
	} catch (err) {
		context.errros.push(new Unprocessable('Can not deleted files', err));
	}

	return context;
};

module.export = {
	deleteUserData,
};
