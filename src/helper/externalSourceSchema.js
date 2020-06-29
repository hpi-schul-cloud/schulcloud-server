/**
 * This module defines a shared Mongoose schema, that should be used
 * to denote that an entity was imported from an external system.
 * Whether this means it was synchronized, imported, created via the API,
 * etc. is up to the specific implementation.
 *
 * @param {String} source the entity's uniquely identified source
 * @param {Object} sourceOptions use-case-specific data, e.g. external ids, configs, etc.
 */
module.exports = {
	source: { type: String, index: true },
	sourceOptions: { type: Object },
};
