const { Configuration } = require('@hpi-schul-cloud/commons');
const request = require('request-promise-native');
const { getCounty, decryptSecretMerlin } = require('../helpers');

class MerlinTokenGenerator {
	setup(app) {
		this.app = app;
	}

	async getMerlinCredentials(county = null) {
		if (county) {
			const countyCredentials = JSON.parse(Configuration.get('SECRET_ES_MERLIN_COUNTIES_CREDENTIALS')).find(
				(c) => c.countyId === county.countyId
			);
			if (countyCredentials) {
				return {
					username: countyCredentials.merlinUser,
					password: countyCredentials.secretMerlinKey,
				};
			}
		}
		return {
			username: Configuration.get('SECRET_ES_MERLIN_USERNAME'),
			password: Configuration.get('SECRET_ES_MERLIN_PW'),
		};
	}

	async FIND(data) {
		const { merlinReference } = data.query;
		if (!Configuration.get('FEATURE_ES_MERLIN_ENABLED')) {
			return Configuration.get('ES_MERLIN_AUTH_URL');
		}
		const { schoolId } = data.authentication.payload;
		const county = await getCounty(schoolId);

		const url = await this.getMerlinUrl(merlinReference, county);
		return url;
	}

	async getMerlinUrl(ref, county) {
		const merlinUri = Configuration.get('ES_MERLIN_AUTH_URL');
		const query = `?nbc&identifier=${ref}`;
		const url = merlinUri + query;

		const credentials = await this.getMerlinCredentials(county);

		const options = {
			method: 'POST',
			url,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			form: {
				username: credentials.username,
				password: credentials.password,
			},
		};
		try {
			const merlinUrl = await request.post(options);
			return merlinUrl;
		} catch (e) {
			throw Error(`Failed to obtain merlin url. Error: ${e}`);
		}
	}
}

module.exports = new MerlinTokenGenerator();
