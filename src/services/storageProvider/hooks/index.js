const CryptoJS = require('crypto-js');
const { authenticate } = require('@feathersjs/authentication');

const globalHooks = require('../../../hooks');

const encryptSecret = (context) => {
	context.data.secretAccessKey = CryptoJS.AES.encrypt(context.data.secretAccessKey, process.env.S3_KEY).toString();
	return context;
};

const decryptSecret = (context) => {
	if (context.result.data) {
		for (const i in context.result.data) {
			if (context.result.data[i].secretAccessKey) {
				context.result.data[i].secretAccessKey = CryptoJS.AES.decrypt(context.result.data[i].secretAccessKey,
					process.env.S3_KEY).toString(CryptoJS.enc.Utf8);
			}
		}
	} else {
		context.result.secretAccessKey = CryptoJS.AES.decrypt(context.result.secretAccessKey, process.env.S3_KEY)
			.toString(CryptoJS.enc.Utf8);
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
	find: [decryptSecret],
	get: [decryptSecret],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
