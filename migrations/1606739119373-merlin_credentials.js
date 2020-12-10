const mongoose = require('mongoose');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { connect, close } = require('../src/utils/database');
const { countySchema } = require('../src/services/federalState/countyModel.js');
const { encryptSecretMerlin } = require('../src/services/edusharing/helpers');
const logger = require('../src/logger');

const federalStateId = '0000b186816abba584714c58'; // Niedersachsen

const federalStateModel = mongoose.model(
	'federalState_countiesNi',
	new mongoose.Schema({
		counties: [{ type: countySchema }],
	}),
	'federalstates'
);

const schoolModel = mongoose.model(
	'schools_countiesNi',
	new mongoose.Schema({
		federalState: { type: mongoose.Types.ObjectId, ref: 'federalstate' },
		county: { type: countySchema },
	}),
	'schools'
);

const updateSchoolCounty = async (county) => {
	const schools = await schoolModel.find({ 'county._id': mongoose.Types.ObjectId(county._id) });
	if (schools.length) {
		await Promise.all(
			schools.map((school) => {
				school.county = county;
				return school.save();
			})
		);
	}
};

// eslint-disable-next-line consistent-return
const importMerlinCredentials = async () => {
	let countiesNi;
	try {
		// eslint-disable-next-line global-require
		countiesNi = require('./helpers/secret_counties_Ni.json');
	} catch (err) {
		logger.error('migration will be skipped: could not find ./helpers/secret_counties_Ni_.json');
		return null;
	}
	if (Configuration.get('FEATURE_ES_MERLIN_ENABLED') === false) {
		logger.error('migration will be skipped: flag FEATURE_ES_MERLIN_ENABLED is not set to true');
		return null;
	}
	if (Configuration.has('SECRET_ES_MERLIN_KEY') === false) {
		throw new Error('You need to set env SECRET_ES_MERLIN_KEY to encrypt');
	}
	const federalState = await federalStateModel.findById(federalStateId);
	const counties = [];
	if (federalState.counties.length) {
		await Promise.all(
			federalState.counties.map((county) => {
				const countyCredentials = countiesNi.find((credentials) => credentials.countyId === county.countyId);
				county.merlinUser = encryptSecretMerlin(countyCredentials.merlinUser);
				county.secretMerlinKey = encryptSecretMerlin(countyCredentials.secretMerlinKey);
				counties.push(county);

				return updateSchoolCounty(county);
			})
		);
	}
	federalState.counties = counties;
	await federalState.save();
};

const removeMerlinCredentials = async () => {
	const federalState = await federalStateModel.findById(federalStateId);
	const counties = [];
	if (federalState.counties.length) {
		await Promise.all(
			federalState.counties.map((county) => {
				county.merlinUser = '';
				county.secretMerlinKey = '';
				counties.push(county);

				return updateSchoolCounty(county);
			})
		);
	}
	federalState.counties = counties;
	await federalState.save();
};

module.exports = {
	up: async function up() {
		await connect();
		await importMerlinCredentials();
		await close();
	},

	down: async function down() {
		await connect();
		await removeMerlinCredentials();
		await close();
	},
};
