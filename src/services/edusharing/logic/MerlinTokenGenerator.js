const { Configuration } = require('@schul-cloud/commons');
const request = require('request-promise-native');

class MerlinTokenGenerator {
	setup(app) {
		this.app = app;
	}

	async FIND(data) {
		const { merlinReference } = data.query;
		const url = await this.getMerlinUrl(merlinReference);
		return url;
	}

	async getMerlinUrl(ref) {
		const options = {
			method: 'POST',
			url: `http://merlin.nibis.de/auth.php?nbc&identifier=${ref}`,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			form: {
				username: Configuration.get('ES_MERLIN_USERNAME'),
				password: Configuration.get('ES_MERLIN_PW'),
			},
		};
		try {
			const merlinUrl = await request(options);
			return merlinUrl;
		} catch (e) {
			throw Error(`Failed to obtain merlin url. Error: ${e}`);
		}
	}
}

module.exports = MerlinTokenGenerator;
