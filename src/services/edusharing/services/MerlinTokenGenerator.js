const { Configuration } = require('@hpi-schul-cloud/commons');
const axios = require('axios');
const { getCounty } = require('../helpers');

class MerlinTokenGenerator {
	setup(app) {
		this.app = app;
	}

	async post(options) {
		const res = await axios(options);

		return res.data;
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

	async FIND(params) {
		const { merlinReference } = params.query;
		if (!Configuration.get('FEATURE_ES_MERLIN_ENABLED')) {
			return Configuration.get('ES_MERLIN_AUTH_URL');
		}
		if ((params.authentication || {}).payload === undefined) {
			throw new Error('No authentication payload in data for MerlinTokenGenerator.find exists.');
		}

		const { schoolId } = params.authentication.payload;
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
			data: {
				username: credentials.username,
				password: credentials.password,
			},
		};
		try {
			const merlinUrl = await this.post(options);
			const checkedUrl = new URL(merlinUrl);
			return checkedUrl.href;
		} catch (err) {
			throw Error(`Failed to obtain Merlin url.`, err);
		}
	}
}

module.exports = new MerlinTokenGenerator();
