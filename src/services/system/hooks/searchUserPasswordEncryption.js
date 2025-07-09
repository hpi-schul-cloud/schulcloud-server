const { Configuration } = require('@hpi-schul-cloud/commons');
const { decryptAES, encryptAES } = require('../../../utils/aes-encryption');

const encryptSecret = (context) => {
	if (context.data.ldapConfig && context.data.ldapConfig.searchUserPassword) {
		context.data.ldapConfig.searchUserPassword = encryptAES(
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
			element.ldapConfig.searchUserPassword = decryptAES(element.ldapConfig.searchUserPassword, ldapPasswordKey);
		});
	} else if (context.result.ldapConfig && context.result.ldapConfig.searchUserPassword) {
		context.result.ldapConfig.searchUserPassword = decryptAES(
			context.result.ldapConfig.searchUserPassword,
			ldapPasswordKey
		);
	}
	return context;
};

module.exports = { encryptSecret, decryptSecret };
