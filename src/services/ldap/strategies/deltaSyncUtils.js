const moment = require('moment');

const getLDAPTimestamp = (date) => `${moment(date).format('YYYYMMDDHHmmss')}Z`;

const getModifiedFilter = (timestamp, attributeName = 'modifyTimestamp') =>
	`(|(!(${attributeName}=*))(${attributeName}>=${timestamp}))`;

const filterForModifiedEntities = (lastChange, existingFilter = '') => {
	if (!(lastChange instanceof Date)) {
		return existingFilter;
	}
	const timestamp = getLDAPTimestamp(lastChange);
	const filter = getModifiedFilter(timestamp);
	return `(&${existingFilter}${filter})`;
};

module.exports = {
	filterForModifiedEntities,
	getModifiedFilter,
	getLDAPTimestamp,
};
