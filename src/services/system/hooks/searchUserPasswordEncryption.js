const CryptoJS = require('crypto-js');
const { Configuration } = require('@hpi-schul-cloud/commons');

const encryptSecret = (context) => {
	if (context.data.ldapConfig && context.data.ldapConfig.searchUserPassword) {
		context.data.ldapConfig.searchUserPassword = CryptoJS.AES.encrypt(
			context.data.ldapConfig.searchUserPassword,
			Configuration.get('LDAP_PASSWORD_ENCRYPTION_KEY')
		).toString();
	}
	return context;
};

const decryptSecret = (context) => {
	const ldapPasswordKey = Configuration.get('LDAP_PASSWORD_ENCRYPTION_KEY');
	if (Array.isArray(context.result)) {
		context.result.forEach((element) => {
			if (!element.ldapConfig || !element.ldapConfig.searchUserPassword) return;
			element.ldapConfig.searchUserPassword = CryptoJS.AES.decrypt(
				element.ldapConfig.searchUserPassword,
				ldapPasswordKey
			).toString(CryptoJS.enc.Utf8);
		});
	} else if (context.result.ldapConfig && context.result.ldapConfig.searchUserPassword) {
		context.result.ldapConfig.searchUserPassword = CryptoJS.AES.decrypt(
			context.result.ldapConfig.searchUserPassword,
			ldapPasswordKey
		).toString(CryptoJS.enc.Utf8);
	}
	return context;
};

module.exports = { encryptSecret, decryptSecret };
