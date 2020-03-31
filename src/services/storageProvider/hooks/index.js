const CryptoJS = require('crypto-js');
const { authenticate } = require('@feathersjs/authentication');
const { Configuration } = require('@schul-cloud/commons');

const globalHooks = require('../../../hooks');

const encryptSecret = (context) => {
	if (context.data.secretAccessKey) {
		context.data.secretAccessKey = CryptoJS.AES
			.encrypt(context.data.secretAccessKey, Configuration.get('S3_KEY'))
			.toString();
	}
	return context;
};

exports.before = {
	all: [authenticate('jwt'), globalHooks.ifNotLocal(globalHooks.isSuperHero())],
	find: [],
	get: [],
	create: [encryptSecret],
	update: [encryptSecret],
	patch: [encryptSecret],
	remove: [],
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
