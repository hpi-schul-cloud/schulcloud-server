const resolveStorageType = (context) => {
	const { params: { payload } } = context;

	return context.app.service('users').find({
		query: {
			_id: payload.userId,
			$populate: ['schoolId'],
		},
	}).then((res) => {
		const [{ schoolId: { _id, fileStorageType } }] = res.data;
		payload.schoolId = _id;
		payload.fileStorageType = fileStorageType;
		return context;
	});
};

module.exports = resolveStorageType;
