const { authenticate } = require('@feathersjs/authentication');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { AesEncryptionHelper } = require('../../../../dist/apps/server/shared/common/utils/aes-encryption');
const { discard, iff, isProvider } = require('feathers-hooks-common');

const { isSuperHero } = require('../../../hooks');

const encryptSecret = (context) => {
	if (context.data.secretAccessKey) {
		context.data.secretAccessKey = AesEncryptionHelper.encrypt(
			context.data.secretAccessKey,
			Configuration.get('S3_KEY')
		);
	}
	return context;
};

exports.before = {
	all: [authenticate('jwt'), iff(isProvider('external'), isSuperHero())],
	find: [],
	get: [],
	create: [encryptSecret],
	update: [encryptSecret],
	patch: [encryptSecret],
	remove: [],
};

exports.after = {
	all: [iff(isProvider('external'), discard('secretAccessKey'))],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
