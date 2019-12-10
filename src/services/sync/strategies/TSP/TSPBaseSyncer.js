const Syncer = require('../Syncer');
const { TspApi, config: TSP_CONFIG } = require('./TSP');

const SCHOOL_SYNCER_TARGET = require('./TSPSchoolSyncer').SYNCER_TARGET;

const SYNCER_TARGET = 'tsp-base';

/**
 * A syncer strategy that creates login/sync systems for the Thuringian School Portal (TSP).
 * @class TSPBaseSyncer
 * @extends {Syncer}
 */
class TSPBaseSyncer extends Syncer {
	/**
	 * @extends Syncer#respondsTo
	 */
	static respondsTo(target) {
		return target === SYNCER_TARGET && TSP_CONFIG.FEATURE_ENABLED;
	}

	/**
	 * Validates the params given to the Syncer.
	 * `params.query` or `data` can optionally contain a config object with:
	 * `{ schoolIdentifier: '4738' // a TSP school id }`
	 * @extends Syncer#params
	 */
	static params(params, data) {
		// todo: filter
		const config = ((params || {}).query || {}).config || (data || {}).config;
		return [config];
	}

	/**
	 * Creates an instance of TSPBaseSyncer.
	 * @param {Object} config see #params
	 * @extends Syncer#constructor
	 */
	constructor(app, stats, logger, config) {
		super(app, stats, logger);
		this.config = config;
		this.api = new TspApi();
		this.stats = Object.assign(this.stats, {
			schools: {
				successful: 0,
				errors: 0,
				entities: [],
			},
		});
	}

	/**
	 * Fetches all schools from the TSP.
	 * @returns {Array<TSPSchool>} schools
	 * @async
	 */
	async getSchools() {
		// todo: eventuell nur Änderungen seit letztem Sync?
		let schools = [];
		try {
			schools = await this.api.request('/tip-ms/api/schulverwaltung_export_schule');
		} catch (err) {
			this.logError('Cannot fetch schools.', err);
			this.stats.errors.push({
				type: 'fetch-schools',
				entity: TSP_CONFIG.BASE_URL,
				message: 'Fehler beim Laden der Schuldaten.',
			});
		}
		return schools;
	}

	/**
	 * Creates or updates a login/sync system based on a TSP school identifier and name
	 * @param {String} identifier TSP school identifier
	 * @param {String} name TSP school name that will be used as system alias and school name
	 * @async
	 */
	async createOrUpdateSchoolSystem(identifier, name) {
		this.stats.schools.entities.push({ identifier, name });
		try {
			this.logInfo(`Finding system for '${name}' (${identifier})...`);
			const system = await this.findSystem(identifier);
			if (system) {
				this.logInfo(`Patching '${name}' (${identifier})...`);
				await this.updateSystem(system._id, name);
			} else {
				this.logInfo(`Nothing found. Creating '${name}' (${identifier})...`);
				await this.createSystem(identifier, name);
			}
			this.stats.schools.successful += 1;
		} catch (err) {
			this.logError(`Encountered an error while creating or updating '${name}' (${identifier}):`, err);
			this.stats.schools.errors += 1;
			this.stats.errors.push({
				type: 'sync-school',
				entity: `'${name}' (${identifier})`,
				message: 'Fehler bei der Synchronisierung der Schule.',
			});
		}
		this.logInfo('Done.');
	}

	async findSystem(identifier) {
		const [system] = await this.app.service('systems').find({
			query: {
				type: SCHOOL_SYNCER_TARGET,
				'tsp.identifier': identifier,
				$limit: 1,
			},
			paginate: false,
		});
		return system;
	}

	async updateSystem(id, name) {
		return this.app.service('systems').patch(id,
			{
				alias: name,
				'tsp.schoolName': name,
			});
	}

	async createSystem(identifier, name) {
		return this.app.service('systems').create({
			type: SCHOOL_SYNCER_TARGET,
			alias: name,
			tsp: {
				identifier,
				schoolName: name,
			},
		});
	}

	/**
	 * Implements synchronization steps.
	 * @returns {Promise<Stats>} sync statistics
	 * @extends Syncer#steps
	 * @async
	 */
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
