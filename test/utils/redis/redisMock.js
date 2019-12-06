const RedisClientMock = class {
	get(...args) {
		return true;
	}

	set(...args) {
		return true;
	}

	del(...args) {
		return true;
	}
};

const redisLibraryMock = {
	createClient: () => new RedisClientMock(),
};

module.exports = redisLibraryMock;
