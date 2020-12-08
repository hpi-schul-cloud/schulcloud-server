const { schoolModel } = require('../school/model');
const { Configuration } = require('@hpi-schul-cloud/commons');
const CryptoJS = require('crypto-js');

exports.getCounty = async (schoolId) => {
	const school = await schoolModel.findById(schoolId);
	return school.county;
};

exports.encryptSecretMerlin = (secret) =>
	CryptoJS.AES.encrypt(secret, Configuration.get('SECRET_ES_MERLIN_KEY')).toString();

exports.decryptSecretMerlin = (secret) =>
	CryptoJS.AES.decrypt(secret, Configuration.get('SECRET_ES_MERLIN_KEY')).toString(CryptoJS.enc.Utf8);
