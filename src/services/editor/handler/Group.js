class Group {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	create({ users }, params) {
		return Promise.resolve({
			_id: '123',
			users: [{ id: '123', name: 'Peter Paul' }]
		});
	}

	patch(groupId, { users }, params) {
		return Promise.resolve({
			groupId,
		});
	}

	get(groupId, params) {
		return Promise.resolve({
			_id: '123',
			users: [{ id: '123', name: 'Peter Paul' }],
		});
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Group;
