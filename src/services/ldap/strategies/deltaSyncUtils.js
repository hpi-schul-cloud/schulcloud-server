/**
 * Convert date to LDAP timestamp format
 * @param date
 * @returns {string} formatted as "YYYYMMDDHHmmssZ"
 */
const dateToLDAPTimestamp = (date) => {
	if (date instanceof Date) {
		return `${date
			.toISOString()
			.replace(/[-:.T]/gi, '')
			.substring(0, 14)}Z`;
	}
	return date;
};

/**
 * Returns an LDAP filter to retrieve only recently updated entities (e.g. based on a
 * timestamp of a previous previous full sync). If the given attribute name does not
 * exist on the server, the resulting query gracefully falls back to all entities. The
 * logic is basically "search for all entities that either have a timestamp greater than
 * the given timestamp in the attribute with the given name, or don't have the attribute
 * at all".
 * @param {String} timestamp time of last modification, formatted as "YYYYMMDDHHmmssZ"
 * @param {String} attributeName optional attribute name to check
 */
const getModifiedFilter = (timestamp, attributeName = 'modifyTimestamp') =>
	// do unquel in combination with <= to get a > which is not supported by ldap
	`(|(!(${attributeName}=*))(!(${attributeName}<=${timestamp})))`;

/**
 * Returns an LDAP filter based on a given filter and a last change time. If lastChange is
 * undefined or does not match the correct format, the base filter is returned. Otherwise,
 * the base filter is combined with a filter for recently updated entities (i.e. updated
 * since lastChange).
 * @param {String} lastChange time of last modification, formatted as "YYYYMMDDHHmmssZ"
 * @param {String} existingFilter optional LDAP-compatible filter condition (including
 * outer parens) [defaults to '']
 * @example
 * 	filterForModifiedEntities(); // => ''
 * 	filterForModifiedEntities('20201020000000Z', '(objectClass=person)');
 * 	// => '(&(objectClass=person)(|(!(modifyTimestamp=*))(modifyTimestamp>=20201020000000Z)))'
 */
const filterForModifiedEntities = (lastChange, existingFilter = '') => {
	if (!/\d{14}Z/.test(lastChange)) {
		return existingFilter;
	}
	const filter = getModifiedFilter(lastChange);
	return `(&${existingFilter}${filter})`;
};

module.exports = {
	filterForModifiedEntities,
	getModifiedFilter,
	dateToLDAPTimestamp,
};
