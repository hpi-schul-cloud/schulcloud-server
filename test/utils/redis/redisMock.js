const valueDict = {};
const ttlDict = {};

const RedisClientMock = class {
	get(key, ...args) {
		const value = valueDict[key];
		const callback = args[args.length - 1];
		callback(null, value);
	}

	set(key, value, ...args) {
		valueDict[key] = value;
		const ex = args.indexOf('EX');
		if (ex >= 0) {
			ttlDict[key] = args[ex + 1];
		}
		const callback = args[args.length - 1];
		callback(null, true);
	}

	del(key, ...args) {
		delete valueDict[key];
		delete ttlDict[key];
		const callback = args[args.length - 1];
		callback(null, true);
	}

	ttl(key, ...args) {
		const ttl = ttlDict[key];
		const callback = args[args.length - 1];
		callback(null, ttl);
	}
};

module.exports = RedisClientMock;
