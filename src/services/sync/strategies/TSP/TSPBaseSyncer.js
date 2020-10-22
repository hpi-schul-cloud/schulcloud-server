const Syncer = require('../Syncer');
const { TspApi, config: TSP_CONFIG, ENTITY_SOURCE, findSchool } = require('./TSP');
const SchoolYearFacade = require('../../../school/logic/year');

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
	 * Implements synchronization steps.
	 * @returns {Promise<Stats>} sync statistics
	 * @extends Syncer#steps
	 * @async
	 */
	async steps() {
		// There is only one login system for all TSP-schools (which is created here if it does not exist).
		await this.ensureLoginSystemExists();

		// Create/update all schools from the API and create/update a school-specific data source
		const schools = await this.getSchools();
		const tasks = schools.map(async ({ schuleNummer: identifier, schuleName: name }) => {
			try {
				const school = await this.createOrUpdateSchool(identifier, name);
				await this.ensureDatasourceExists(school);
				this.stats.schools.successful += 1;
			} catch (err) {
				this.logError(`Encountered an error while creating or updating '${name}' (${identifier}):`, { error: err });
				this.stats.schools.errors += 1;
				this.stats.errors.push({
					type: 'sync-school',
					entity: `'${name}' (${identifier})`,
					message: 'Fehler bei der Synchronisierung der Schule.',
				});
			}
		});
		await Promise.all(tasks);
		return this.stats;
	}

	async ensureLoginSystemExists() {
		let system = await this.findSystem();
		if (!system) {
			system = await this.createSystem();
		}
		this.tspSystemId = system._id;
	}

	async findSystem() {
		const [system] = await this.app.service('systems').find({
			query: {
				type: SCHOOL_SYNCER_TARGET,
				$limit: 1,
			},
			paginate: false,
		});
		return system;
	}

	async createSystem() {
		return this.app.service('systems').create({
			type: SCHOOL_SYNCER_TARGET,
			alias: 'Thüringer Schulportal',
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
	async createOrUpdateSchool(identifier, name) {
		let result;
		this.stats.schools.entities.push({ identifier, name });
		this.logInfo(`Finding school '${name}' (${identifier})...`);
		const school = await findSchool(this.app, identifier);
		if (school) {
			this.logInfo(`Updating '${name}' (${identifier})...`);
			result = await this.updateSchool(school, name);
		} else {
			this.logInfo(`School not found. Creating '${name}' (${identifier})...`);
			result = await this.createSchool(identifier, name);
		}
		this.logInfo(`'${name}' (${identifier}) exists.`);
		return result;
	}

	/**
	 * Creates a school based on a TSP identifier and name
	 * @param {String} identifier the TSP school identifier
	 * @param {String} name the school name
	 * @returns {School} School
	 * @async
	 */
	async createSchool(identifier, name) {
		return this.app.service('schools').create({
			name,
			systems: [this.tspSystemId],
			currentYear: await this.getCurrentYear(),
			federalState: await this.getFederalState(),
			source: ENTITY_SOURCE,
			sourceOptions: {
				schoolIdentifier: identifier,
			},
		});
	}

	/**
	 * Updates a school
	 * @param {School} school
	 * @param {String} name
	 * @returns {School} school
	 * @async
	 */
	async updateSchool(school, name) {
		return this.app.service('schools').patch(school._id, {
			name,
		});
	}

	// async getters do not exist, so this will have to do
	async getCurrentYear() {
		if (!this.currentYear) {
			const years = await this.app.service('years').find();
			if (years.total === 0) {
				throw new Error('At least one year has to exist in the database.');
			}
			this.currentYear = new SchoolYearFacade(years.data).defaultYear;
		}
		return this.currentYear;
	}

	// async getters do not exist, so this will have to do
	async getFederalState() {
		if (!this.federalState) {
			const states = await this.app.service('federalStates').find({ query: { abbreviation: 'TH' } });
			if (states.total === 0) {
				throw new Error('The federal state does not exist.');
			}
			this.federalState = states.data[0]._id;
		}
		return this.federalState;
	}

	async ensureDatasourceExists(school) {
		const schoolName = `'${school.name}' (${school.sourceOptions.schoolIdentifier})`;
		const existingDatasource = await this.findDatasource(school);
		if (existingDatasource === null) {
			this.logInfo(`There is no datasource for ${schoolName} yet. Creating it...`);
			await this.createDatasource(school);
		}
		this.logInfo(`Datasource for ${schoolName} exists.`);
	}

	async findDatasource(school) {
		const datasources = this.app.service('datasources').find({
			query: {
				schoolId: school._id,
				'config.target': SCHOOL_SYNCER_TARGET,
				$limit: 1,
			},
			paginate: false,
		});
		if (Array.isArray(datasources) && datasources.length === 1) {
			return datasources[0];
		}
		return null;
	}

	async createDatasource(school) {
		return this.app.service('datasources').create({
			schoolId: school._id,
			name: 'TSP',
			config: {
				target: SCHOOL_SYNCER_TARGET,
				config: {
					schoolIdentifier: school.sourceOptions.schoolIdentifier,
				},
			},
		});
	}
}

module.exports = {
	TSPBaseSyncer,
	SYNCER_TARGET,
};
