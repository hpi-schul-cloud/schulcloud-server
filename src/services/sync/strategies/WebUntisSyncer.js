const Syncer = require('./Syncer');

class WebUntisSyncer extends Syncer {
	static respondsTo(target) {
		return target === 'webuntis';
	}

	static params(params, data = {}) {
		const query = (params || {}).query || {};
		if (query.username && query.password && query.url) {
			return [true];
		}
		return false;
	}
}

module.exports = WebUntisSyncer;
