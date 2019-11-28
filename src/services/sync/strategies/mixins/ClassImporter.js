const { classObjectFromName } = require('../../../user-group/logic/classes');

/**
 * Provides a mixin for the Syncer interface to create or update classes
 * based on a list of class names.
 * @see https://github.com/justinfagnani/mixwith.js for more info about mixins
 *
 * @param {Class} superClass the class to extend (should be Syncer or a subclass)
 * @returns {Class} a subclass factory building a class with mixed-in functionality
 * @mixin
 */
module.exports = (superClass) => class ClassImporter extends superClass {
	constructor(...args) {
		super(...args);
		this.stats.classes = {
			successful: 0,
			failed: 0,
			created: 0,
			updated: 0,
		};
	}

	/**
     * Builds a mapping (class name => class object) for a given list of class names.
     * If a class does not yet exist, it is created in the process.
     *
     * @param {Array<String>} classes list of class names
     * @param {Object} options options to be provided to the class objects
     * @returns {Object<String,Class>}
     */
	async buildClassMapping(classes, options) {
		const classMapping = {};
		const uniqueClasses = [...new Set(classes)];
		await Promise.all(uniqueClasses.map(async (klass) => {
			if (classMapping[klass] === undefined) {
				classMapping[klass] = await this.findOrCreateClass({
					...options,
					name: klass,
				});
			}
		}));
		return classMapping;
	}

	/**
     * Returns a class for a given search query. Creates a class if none exists.
     * @param {Object} classObject class attributes
	 * @param {Object} query [optional] query to find an existing class. If undefined, query==classObject
     * @returns {Class} a Schul-Cloud class
     */
	async findOrCreateClass(classObject, query) {
		let theClass = null;
		let options = classObject;
		try {
			if (options.name && !options.gradeLevel) {
				options = await classObjectFromName(options.name, options);
			}
			const existing = await this.findClass(query || options);
			if (!existing) {
				theClass = await this.createClass(options);
			} else {
				this.stats.classes.updated += 1;
				theClass = existing;
			}
			this.stats.classes.successful += 1;
		} catch (err) {
			this.stats.classes.failed += 1;
			this.stats.errors.push({
				type: 'class',
				entity: JSON.stringify(options),
				message: err.message,
			});
			this.logError('Failed to process class', options, err);
		}
		return theClass;
	}

	async findClass(query) {
		const existingClasses = await this.app.service('/classes').find({
			query,
			paginate: false,
			lean: true,
		});
		if (existingClasses.length > 0) {
			return existingClasses[0];
		}
		return null;
	}

	async createClass(classObject) {
		let newClass = null;
		try {
			newClass = await this.app.service('/classes').create(classObject);
			this.stats.classes.created += 1;
		} catch (err) {
			this.stats.classes.failed += 1;
			this.stats.errors.push({
				type: 'class',
				entity: JSON.stringify(classObject),
				message: err.message,
			});
			this.logError('Failed to create class', classObject, err);
		}
		return newClass;
	}
};
