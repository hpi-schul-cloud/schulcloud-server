const { BadRequest } = require('@feathersjs/errors');

const Syncer = require('../Syncer');
const { TspApi } = require('./TSP');

const SCHOOL_SYNCER_TARGET = require('./TSPSchoolSyncer').SYNCER_TARGET;

const SYNCER_TARGET = 'tsp-base';

class TSPBaseSyncer extends Syncer {
	static respondsTo(target) {
		return target === SYNCER_TARGET;
	}

	static params(params, data) {
		// todo: filter
		const config = ((params || {}).query || {}).config || (data || {}).config;
		if (!config) {
			throw new BadRequest('Missing parameter "config".');
		}
		if (!config.baseUrl) {
			throw new BadRequest('Missing parameter "config.baseUrl" (URL that points to the TSP Server).');
		}
		if (!config.clientId) {
			throw new BadRequest('Missing parameter "config.clientId" (clientId to be used for TSP requests)');
		}
		return [config];
	}

	constructor(app, stats, logger, config) {
		super(app, stats, logger);
		this.config = config;
		this.api = new TspApi(config);
		this.stats = Object.assign(this.stats, {
			numberOfSchools: 0,
			schools: [],
		});
	}

	async getSchools() {
		// todo: eventuell nur Änderungen seit letztem Sync?
		let schools = [];
		try {
			schools = await this.api.request('/tip-ms/api/schulverwaltung_export_schule');
		} catch (err) {
			this.logError('Cannot fetch schools.', err);
			this.stats.errors.push({
				type: 'fetch-schools',
				entity: this.config.baseUrl,
				message: 'Fehler beim Laden der Schuldaten.',
			});
		}
		return schools;
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
					alias: name,
					'tsp.schoolName': name,
				},
			);
		} else {
			this.logInfo(`Nothing found. Creating '${name}' (${identifier})...`);
			await this.app.service('systems').create({
				type: SCHOOL_SYNCER_TARGET,
				alias: name,
				tsp: {
					identifier,
					schoolName: name,
					...this.config,
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
