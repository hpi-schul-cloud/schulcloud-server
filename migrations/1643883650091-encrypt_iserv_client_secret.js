const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');
const { Configuration } = require('@hpi-schul-cloud/commons');
// eslint-disable-next-line no-unused-vars
const { alert, info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const systemModel = require('../src/services/system/model');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
// const User = mongoose.model(
// 	'makeMeUnique',
// 	new mongoose.Schema(
// 		{
// 			firstName: { type: String, required: true },
// 			lastName: { type: String, required: true },
// 		},
// 		{
// 			timestamps: true,
// 		}
// 	),
// 	'users'
// );

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
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.
		const systems = await systemModel.find({});

		info('Start encrypting client_secret of the "iserv" system');
		await Promise.all(
			systems.map((system) => {
				if (system.type !== 'iserv') return Promise.resolve();

				const encryptedSecret = CryptoJS.AES.encrypt(
					system.oautchconfig.client_secret,
					Configuration.get('LDAP_PASSWORD_ENCRYPTION_KEY')
				).toString();
				const newoauthconfig = { ...system.oauthconfig };
				newoauthconfig.cleint_secret = encryptedSecret;
				info(`Encrypting client_secret of system { id: ${system.id}), alias: ${system.alias} }`);
				return systemModel.updateOne({
					oauthconfig: newoauthconfig,
				});
			})
		);
		info('Finished encrypting client_secret of the "iserv" system');

		await close();
	},

	down: async function down() {
		if (!Configuration.has('LDAP_PASSWORD_ENCRYPTION_KEY')) {
			throw new Error('You need to set LDAP_PASSWORD_ENCRYPTION_KEY to decrypt the key!');
		}
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		const systems = await systemModel.find();

		info('Start decrypting the client_secret of the "iserv" system');
		await Promise.all(
			systems.map((system) => {
				if (system.type !== 'iserv') return Promise.resolve();
				const decryptedSecret = CryptoJS.AES.decrypt(
					system.oautchconfig.client_secret,
					Configuration.get('LDAP_PASSWORD_ENCRYPTION_KEY')
				).toString();
				const newoauthconfig = { ...system.oauthconfig };
				newoauthconfig.cleint_secret = decryptedSecret;

				return systemModel.updateOne({
					oauthconfig: newoauthconfig,
				});
			})
		);
		info('Finished decrypting client_secret of the "iserv" system');
		await close();
	},
};
