const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');
const { Configuration } = require('@hpi-schul-cloud/commons');

const { connect, close } = require('../src/utils/database');

// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');
const systemModel = require('../src/services/system/model');

// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line

module.exports = {
	up: async function up() {
		if (!Configuration.has('LDAP_PASSWORD_ENCRYPTION_KEY')) {
			throw new Error('You need to set LDAP_PASSWORD_ENCRYPTION_KEY to encrypt the old key!');
		}
		await connect();

		const systems = await systemModel.find({});

		info('Start encrypting searchUserPasswords of "systems"');
		await Promise.all(
			systems.map((system) => {
				if (system.type !== 'ldap') return Promise.resolve();

				const encryptedPW = CryptoJS.AES.encrypt(
					system.ldapConfig.searchUserPassword,
					Configuration.get('LDAP_PASSWORD_ENCRYPTION_KEY')
				).toString();
				const newLdapConfig = { ...system.ldapConfig };
				newLdapConfig.searchUserPassword = encryptedPW;
				info(`Encrypting searchUserPassword of system { id: ${system.id}), alias: ${system.alias} }`);
				return systemModel.updateOne(
					{
						_id: system._id,
					},
					{
						ldapConfig: newLdapConfig,
					}
				);
			})
		);
		info('Finished encrypting searchUserPasswords of "systems"');

		await close();
	},

	down: async function down() {
		if (!Configuration.has('LDAP_PASSWORD_ENCRYPTION_KEY')) {
			throw new Error('You need to set LDAP_PASSWORD_ENCRYPTION_KEY to decrypt the key!');
		}
		await connect();

		const systems = await systemModel.find();

		info('Start decrypting searchUserPasswords of "systems"');
		await Promise.all(
			systems.map((system) => {
				if (system.type !== 'ldap') return Promise.resolve();
				const decryptedPW = CryptoJS.AES.decrypt(
					system.ldapConfig.searchUserPassword,
					Configuration.get('LDAP_PASSWORD_ENCRYPTION_KEY')
				).toString();
				const newLdapConfig = { ...system.ldapConfig };
				newLdapConfig.searchUserPassword = decryptedPW;

				return systemModel.update(
					{
						_id: system._id,
					},
					{
						ldapConfig: newLdapConfig,
					}
				);
			})
		);
		info('Finished decrypting searchUserPasswords of "systems"');

		await close();
	},
};
