const { checkScopePermissions } = require('./checkScopePermissions');
const { lookupScope } = require('./lookupScope');
const { rejectQueryingOtherUsers } = require('./rejectQueryingForOtherUsers');

module.exports = {
	checkScopePermissions,
	lookupScope,
	rejectQueryingOtherUsers,
};
