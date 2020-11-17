const { Configuration } = require('@hpi-schul-cloud/commons');
const request = require('request-promise-native');

class MerlinTokenGenerator {
	setup(app) {
		this.app = app;
	}

	async FIND(data) {
		const { merlinReference } = data.query;
		if (!Configuration.get('FEATURE_ES_MERLIN_ENABLED')) {
			return Configuration.get('ES_MERLIN_AUTH_URL');
		}
		const url = await this.getMerlinUrl(merlinReference);
		return url;
	}

	async getMerlinUrl(ref) {
		const merlinUri = Configuration.get('ES_MERLIN_AUTH_URL');
		const query = `?nbc&identifier=${ref}`;
		const url = merlinUri + query;
		const options = {
			method: 'POST',
			url,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			form: {
				username: Configuration.get('SECRET_ES_MERLIN_USERNAME'),
				password: Configuration.get('SECRET_ES_MERLIN_PW'),
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
