const { rejectQueryingOtherUsers } = require('./rejectQueryingForOtherUsers');
const { lookupScope } = require('./lookupScope');

module.exports = {
	lookupScope,
	rejectQueryingOtherUsers,
};
