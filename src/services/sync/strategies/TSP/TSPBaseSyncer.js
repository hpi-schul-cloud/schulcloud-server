const Syncer = require('../Syncer');
const { TspApi } = require('./TSP');

const SCHOOL_SYNCER_TARGET = require('./TSPSchoolSyncer').SYNCER_TARGET;

const SYNCER_TARGET = 'tsp-base';

class TSPBaseSyncer extends Syncer {
	static respondsTo(target) {
		return target === SYNCER_TARGET;
	}

	static params(params) {
		// todo: fill
		return [
			{ baseUrl: 'https://example.org/tsp' }, // config
		];
	}

	constructor(app, stats, logger, config) {
		super(app, stats, logger);
		this.config = config;
		this.api = new TspApi(config.baseUrl);
		this.stats = Object.assign(this.stats, {
			numberOfSchools: 0,
			schools: [],
		});
	}

	async getSchools() {
		// todo: eventuell nur Änderungen seit letztem Sync?
		try {
			return this.api.request('/tip-ms/api/schulverwaltung_export_schule');
		} catch (err) {
			this.stats.errors += 1;
			// todo: create error object
		}
		return [];
	}

	async createOrUpdateSchoolSystem(identifier, name) {
		this.logInfo(`Finding system for '${name}' (${identifier})...`);
		const [system] = await this.app.service('systems').find({
			query: {
				type: SCHOOL_SYNCER_TARGET,
				'tsp.identifier': identifier,
				$limit: 1,
			},
			paginate: false,
		});
		if (system) {
			this.logInfo(`Patching '${name}' (${identifier})...`);
			await this.app.service('systems').patch(
				system._id,
				{
					'tsp.schoolName': name,
				},
			);
		} else {
			this.logInfo(`Nothing found. Creating '${name}' (${identifier})...`);
			await this.app.service('systems').create({
				type: SCHOOL_SYNCER_TARGET,
				tsp: {
					identifier,
					schoolName: name,
					baseUrl: this.config.baseUrl,
				},
			});
		}
		this.stats.numberOfSchools += 1;
		this.stats.schools.push({ identifier, name });
		this.logInfo('Done.');
	}

	async steps() {
		const schools = await this.getSchools();
		for (const { schuleNummer, schuleName } of schools) {
			await this.createOrUpdateSchoolSystem(schuleNummer, schuleName);
		}
		return this.stats;
	}
}

module.exports = {
	TSPBaseSyncer,
	SYNCER_TARGET,
};
