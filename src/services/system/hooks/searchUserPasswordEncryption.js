const { Configuration } = require('@hpi-schul-cloud/commons');
const { decryptAes, encryptAes } = require('../../../utils/aes-encryption');

const encryptSecret = (context) => {
	if (context.data.ldapConfig && context.data.ldapConfig.searchUserPassword) {
		context.data.ldapConfig.searchUserPassword = encryptAes(
			context.data.ldapConfig.searchUserPassword,
			Configuration.get('LDAP_PASSWORD_ENCRYPTION_KEY')
		);
	}
	return context;
};

const decryptSecret = (context) => {
	const ldapPasswordKey = Configuration.get('LDAP_PASSWORD_ENCRYPTION_KEY');
	if (Array.isArray(context.result)) {
		context.result.forEach((element) => {
			if (!element.ldapConfig || !element.ldapConfig.searchUserPassword) return;
			element.ldapConfig.searchUserPassword = decryptAes(element.ldapConfig.searchUserPassword, ldapPasswordKey);
		});
	} else if (context.result.ldapConfig && context.result.ldapConfig.searchUserPassword) {
		context.result.ldapConfig.searchUserPassword = decryptAes(
			context.result.ldapConfig.searchUserPassword,
			ldapPasswordKey
		);
	}
	return context;
};

module.exports = { encryptSecret, decryptSecret };
