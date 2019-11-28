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
				classMapping[klass] = await this.findOrCreateClassByName(klass, options);
			}
		}));
		return classMapping;
	}

	/**
     * Returns a class for a given name. Creates a class if none exists.
     *
     * @param {String} className the class name
     * @returns {Class} a Schul-Cloud class
     * @throws if class does not exist and cannot be created
     */
	async findOrCreateClassByName(className, options) {
		let result = null;
		try {
			const classObject = await classObjectFromName(className, options);
			result = await this.findOrCreateClass(classObject);
			this.stats.classes.successful += 1;
		} catch (err) {
			this.stats.classes.failed += 1;
			this.stats.errors.push({
				type: 'class',
				entity: className,
				message: err.message,
			});
			this.logError('Failed to create class', className, err);
		}
		return result;
	}

	/**
     * Returns a class for a given search query. Creates a class if none exists.
     *
     * @param {Object} classObject search query
     * @returns {Class} a Schul-Cloud class
     * @throws if class does not exist and cannot be created
     */
	async findOrCreateClass(classObject) {
		const existing = await this.app.service('/classes').find({
			query: classObject,
			paginate: false,
			lean: true,
		});
		if (existing.length === 0) {
			const newClass = await this.app.service('/classes').create(classObject);
			this.stats.classes.created += 1;
			return newClass;
		}
		this.stats.classes.updated += 1;
		return existing[0];
	}
};
