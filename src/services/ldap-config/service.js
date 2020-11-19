const logger = require('../../logger');

class LdapConfigService {
	setup(app) {
		this.app = app;
	}

	async create(config, params) {
		const { verifyOnly } = params.query;

		const verificationResult = await this.verifyConfig(config);

		if (verificationResult.ok && !verifyOnly) {
			await this.saveConfig(config);
		}
		return verificationResult;
	}

	async verifyConfig(config) {
		const ldap = this.app.service('ldap');
		const result = {
			ok: false,
			users: {},
			classes: {},
		};
		try {
			const users = await ldap.getUsers(config);
			result.users = LdapConfigService.generateUserStats(users);
			const classes = await ldap.getClasses(config);
			result.classes = LdapConfigService.generateClassStats(classes);
			result.ok = true;
		} catch (error) {
			logger.warning('Error during LDAP config verification', { error });
		} finally {
			ldap.disconnect(config);
		}
		return result;
	}

	async saveConfig(/* config */) {
		return 42;
	}

	static generateUserStats(users = []) {
		const result = {
			total: users.length,
			admin: 0,
			teacher: 0,
			student: 0,
			sample: users.length > 0 ? users[0] : {},
		};
		for (const user of users) {
			if (user.roles.includes('administrator')) result.admin += 1;
			if (user.roles.includes('teacher')) result.teacher += 1;
			if (user.roles.includes('student')) result.student += 1;
		}
		return result;
	}

	static generateClassStats(classes = []) {
		return {
			total: classes.length,
			sample: classes.length > 0 ? classes[0] : {},
		};
	}
}

module.exports = LdapConfigService;
