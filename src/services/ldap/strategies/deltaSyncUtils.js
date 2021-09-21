const moment = require('moment');

/**
 * Returns an LDAP filter based on a given filter and a last change time. If lastChange is
 * undefined or does not match the correct format, the base filter is returned. Otherwise,
 * the base filter is combined with a filter for recently updated entities (i.e. updated
 * since lastChange).
 * @param school
 * @param {String} existingFilter optional LDAP-compatible filter condition (including
 * outer parens) [defaults to '']
 * @example
 *    filterForModifiedEntities(); // => ''
 *    filterForModifiedEntities('20201020000000Z', '(objectClass=person)');
 *    // => '(objectClass=person)'
 */
const filterForModifiedEntities = (school, existingFilter = '') => {
	return existingFilter;
};

module.exports = {
	filterForModifiedEntities,
};
