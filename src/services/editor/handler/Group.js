const { request } = require('../helper/');

class Group {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	create({ users }, params) {
		return request({
			uri: 'groups',
			method: 'create',
			data: {users},
			userId: '123',
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
