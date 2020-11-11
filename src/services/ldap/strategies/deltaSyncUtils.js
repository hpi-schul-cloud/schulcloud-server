const moment = require('moment');

const getLDAPTimestamp = (date) => `${moment(date).format('YYYYMMDDHHmmss')}Z`;

const getModifiedFilter = (timestamp, attributeName = 'modifyTimestamp') =>
	`(|(!(${attributeName}=*))(${attributeName}>=${timestamp}))`;

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
	getLDAPTimestamp,
};
