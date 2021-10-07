const resolveStorageType = (context) => {
	const {
		params: { payload, account },
	} = context;
	const userId = payload.userId || (account || {}).userId;
	return context.app
		.service('users')
		.get(userId, {
			query: {
				$populate: ['schoolId'],
			},
		})
		.then((user) => {
			const {
				schoolId: { _id, fileStorageType },
			} = user;
			payload.schoolId = _id;
			payload.fileStorageType = fileStorageType;
			return context;
		});
};

module.exports = resolveStorageType;
