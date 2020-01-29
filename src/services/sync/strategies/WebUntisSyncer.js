const Syncer = require('./Syncer');

class WebUntisSyncer extends Syncer {
	constructor(app, stats, logger, datasourceRunId) {
		super(app, stats, logger);
		this.datasourceRunId = datasourceRunId;
	}

	static respondsTo(target) {
		return target === 'webuntis';
	}

	static params(params, data = {}) {
		const query = (params || {}).query || {};
		if (query.username && query.password && query.url) {
			return [params.datasourceRunId];
		}
		return false;
	}

	async steps() {
		await super.steps();
		await Promise.all(new Array(40).fill('').map(() => this.app.service('webuntisMetadata').create({
			datasourceRunId: this.datasourceRunId,
			teacher: 'Renz',
			class: '2a',
			room: '0-23',
			subject: 'mathe',
		})));

		return Promise.resolve();
	}
}

module.exports = WebUntisSyncer;
