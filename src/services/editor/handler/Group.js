class Group {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	static create({ users }, params) {
		return {
			_id: '123',
			users: [{ id: '123', name: 'Peter Paul' }]
		};
	}

	static patch(groupId, { users }, params) {
		return {
			groupId,
		};
	}

	static get(groupId, params) {
		return {
			_id: '123',
			users: [{ id: '123', name: 'Peter Paul' }]
		};
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Group;
