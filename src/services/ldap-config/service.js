class LdapConfigService {
	async create(config, params) {
		const { verifyOnly } = params.query;

		const verificationResult = await this.verifyConfig(config);

		if (verificationResult.ok && !verifyOnly) {
			await this.saveConfig(config);
		}
		return verificationResult;
	}

	async verifyConfig(/* config */) {
		return {
			ok: true,
			users: {
				total: 1396,
				admin: 4,
				teacher: 20,
				student: 1372,
				sample: {},
			},
			classes: {
				total: 27,
				sample: {},
			},
		};
	}

	async saveConfig(/* config */) {
		return 42;
	}
}

module.exports = LdapConfigService;
