const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');
const { Configuration } = require('@schul-cloud/commons');

const { connect, close } = require('../src/utils/database');

// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');
const { systemModel } = require('../src/services/system/model');

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb


// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line

module.exports = {
	up: async function up() {
		if (!Configuration.has('LDAP_PASSWORD_ENCRYPTION_KEY')) {
			throw new Error('You need to set LDAP_PASSWORD_ENCRYPTION_KEY to encrypt the old key!');
		}
		await connect();

		const systems = systemModel.find();

		Promise.all(systems.map((system) => {
			const encryptedPW = CryptoJS.AES
				.encrypt(system.ldapConfig.searchUserPassword, Configuration.get('LDAP_PASSWORD_ENCRYPTION_KEY'))
				.toString();
			const newLdapConfig = { ...system.ldapConfig };
			newLdapConfig.searchUserPassword = encryptedPW;

			return systemModel.update({
				_id: system._id,
			}, {
				ldapConfig: newLdapConfig,
			});
		}));

		await close();
	},

	down: async function down() {
		if (!Configuration.has('LDAP_PASSWORD_ENCRYPTION_KEY')) {
			throw new Error('You need to set LDAP_PASSWORD_ENCRYPTION_KEY to encrypt the old key!');
		}
		await connect();

		const systems = systemModel.find();

		Promise.all(systems.map((system) => {
			const decryptedPW = CryptoJS.AES
				.decrypt(system.ldapConfig.searchUserPassword, Configuration.get('LDAP_PASSWORD_ENCRYPTION_KEY'))
				.toString();
			const newLdapConfig = { ...system.ldapConfig };
			newLdapConfig.searchUserPassword = decryptedPW;

			return systemModel.update({
				_id: system._id,
			}, {
				ldapConfig: newLdapConfig,
			});
		}));

		await close();
	},
};
