const { NotFound } = require('@feathersjs/errors');

const resolveStorageType = (context) => {
	const { params: { payload } } = context;

	return context.app.service('users').find({
		query: {
			_id: payload.userId,
			$populate: ['schoolId'],
		},
	}).then((users) => {
		if (users.length === 1) {
			throw new NotFound('Can not match user.');
		}
		const [{ schoolId: { _id, fileStorageType } }] = users.data;
		payload.schoolId = _id;
		payload.fileStorageType = fileStorageType;
		return context;
	}).catch((err) => {
		throw new Error(err);
	});
};

module.exports = resolveStorageType;
