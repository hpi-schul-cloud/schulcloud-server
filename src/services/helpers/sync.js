const ldap = require('ldapjs');

module.exports = function (app) {

	class SyncService {
		constructor() {

        }
        
		find(params) {
			return true;
		}
	}

	return SyncService;
};