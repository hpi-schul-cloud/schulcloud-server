/* const { Configuration } = require('@schul-cloud/commons');
const request = require('request-promise-native');

class MerlinTokenGenerator {
	constructor() {
		if (MerlinTokenGenerator.instance) {
			return MerlinTokenGenerator.instance;
		}
		this.username = Configuration.get('ES_MERLIN_USERNAME');
		this.password = Configuration.get('ES_MERLIN_PW');
		MerlinTokenGenerator.instance = this;
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
				username: this.username,
				password: this.password,
			},
		};
		try {
			const merlinUrl = await request(options);
			return merlinUrl;
		} catch (e) {
			throw Error(`Failed to obtain merlin url. Error: ${e}`);
		}
	}

	static get Instance() {
		if (!MerlinTokenGenerator.instance) {
			return new MerlinTokenGenerator();
		}
		return MerlinTokenGenerator.instance;
	}
}

module.exports = MerlinTokenGenerator.Instance;
 */
