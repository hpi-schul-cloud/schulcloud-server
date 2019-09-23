const { checkScopePermission } = require('./checkScopePermission');
const { lookupScope } = require('./lookupScope');
const { rejectQueryingOtherUsers } = require('./rejectQueryingForOtherUsers');

module.exports = {
	checkScopePermission,
	lookupScope,
	rejectQueryingOtherUsers,
};
