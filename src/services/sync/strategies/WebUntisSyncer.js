const { BadRequest } = require('../../../errors');
const Syncer = require('./Syncer');

class WebUntisSyncer extends Syncer {
	constructor(app, stats, logger, data) {
		super(app, stats, logger);
		this.data = data;
	}

	static respondsTo(target) {
		return target === 'webuntis';
	}

	static params(params, data = {}) {
		const query = (params || {}).query || {};
		const validParams = query.username && query.password && query.url;
		const validData = ['inclusive', 'exclusive'].includes(data.datatype) || (!data.datatype && !data.courseMetadataIds);
		if (validParams && validData) {
			return [
				{
					datasourceId: params.datasourceId,
					username: params.query.username,
					password: params.query.password,
					url: params.query.url,
					datatype: data.datatype,
					courseMetadataIds: data.courseMetadataIds,
					dryrun: params.dryrun,
				},
			];
		}
		return false;
	}

	/* ---------------------------------------------------------------------------------
	this should be replaced by real data once the actual untis sync is written
	-------------------------------------------------------------------------------------*/
	getimportCondition() {
		if (this.data.datatype === 'inclusive') {
			return (id) => this.data.courseMetadataIds.includes(id);
		}
		if (this.data.datatype === 'exclusive') {
			return (id) => !this.data.courseMetadataIds.includes(id);
		}
		throw new BadRequest('invalid datatype');
	}

	async writeMockMetadata() {
		if (this.data.datasourceId) {
			const metadata = await this.app.service('webuntisMetadata').find({
				query: { datasourceId: this.data.datasourceId },
			});
			const newMockAmount = metadata.total > 10 ? 3 : 40;
			await Promise.all(
				new Array(newMockAmount).fill('').map(() =>
					this.app.service('webuntisMetadata').create({
						datasourceId: this.data.datasourceId,
						teacher: 'Renz',
						class: '2a',
						room: '0-23',
						subject: 'mathe',
						state: 'new',
					})
				)
			);
		}
		return Promise.resolve();
	}

	async updateMockMetadata() {
		if (this.data.datasourceId) {
			const metadata = await this.app.service('webuntisMetadata').find({
				query: { datasourceId: this.data.datasourceId },
			});
			const importCondition = this.getimportCondition();
			const promises = [];
			metadata.data.forEach((md) => {
				if (importCondition(md._id.toString())) {
					promises.push(this.app.service('webuntisMetadata').patch(md._id, { state: 'imported' }));
				} else {
					promises.push(this.app.service('webuntisMetadata').patch(md._id, { state: 'discarded' }));
				}
			});
			await Promise.all(promises);
		}
		return Promise.resolve();
	}

	// -------------------------------------------------------------------------------------------------------

	async steps() {
		await super.steps();
		if (this.data.dryrun) {
			await this.writeMockMetadata();
		} else {
			await this.updateMockMetadata();
		}

		return Promise.resolve();
	}
}

module.exports = WebUntisSyncer;
