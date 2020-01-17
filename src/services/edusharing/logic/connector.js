const REQUEST_TIMEOUT = 8000; // ms
const request = require('request-promise-native');

// STACKOVERFLOW BEAUTY
function validURL(str) {
	const pattern = new RegExp(
		'^(https?:\\/\\/)?'
		+ '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'
		+ '((\\d{1,3}\\.){3}\\d{1,3}))'
		+ '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'
		+ '(\\?[;&a-z\\d%_.~+=-]*)?'
		+ '(\\#[-a-z\\d_]*)?$',
		'i',
	);
	return !!pattern.test(str);
}

class EduSharingConnector {
	constructor() {
		if (EduSharingConnector.instance) {
			return EduSharingConnector.instance;
		}
		if (!validURL(this.url)) {
			return 'Invalid ES_DOMAIN, check your .env';
		}
		this.authorization = null; // JSESSION COOKIE
		this.accessToken = null; // ACCESSTOKEN
		EduSharingConnector.instance = this;
	}

	static get headers() {
		return {
			Accept: 'application/json',
			'Content-type': 'application/json',
		};
	}

	static get authorization() {
		const userName = process.env.ES_USER;
		const pw = process.env.ES_PASSWORD;
		const headers = {
			...EduSharingConnector.headers,
			Authorization: `Basic ${Buffer.from(`${userName}:${pw}`).toString(
				'base64',
			)}`,
		};

		return headers;
	}

	// gets cookie (JSESSION) and attach it to header
	getCookie() {
		const cookieOptions = {
			uri: `${process.env.ES_DOMAIN}/edu-sharing/rest/authentication/v1/validateSession`,
			method: 'GET',
			headers: EduSharingConnector.authorization,
			resolveWithFullResponse: true,
			json: true,
		};
		return request(cookieOptions)
			.then((result) => {
				if (
					result.statusCode !== 200
					|| result.body.isValidLogin !== true
				) {
					throw Error('authentication error with edu sharing');
				}
				return result.headers['set-cookie'][0];
			})
			.catch((err) => {
				// eslint-disable-next-line no-console
				console.error('error: ', err);
			});
	}

	// gets access_token and refresh_token
	getAuth() {
		const oauthoptions = {
			method: 'POST',
			url: `${process.env.ES_DOMAIN}/edu-sharing/oauth2/token`,
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },

			// eslint-disable-next-line max-len
			body: `grant_type=${'password'}&client_id=${process.env.ES_CLIENT_ID}&client_secret=${process.env.ES_OAUTH_SECRET}&username=${process.env.ES_USER}&password=${process.env.ES_PASSWORD}`,
			timeout: REQUEST_TIMEOUT,
		};
		return request(oauthoptions).then((result) => {
			if (result) {
				const parsedResult = JSON.parse(result);
				return parsedResult.access_token;
			}
			// eslint-disable-next-line no-console
			console.error('Oauth failed');
			return null;
		});
	}

	checkEnv() {
		return (
			process.env.ES_DOMAIN
			&& process.env.ES_USER
			&& process.env.ES_PASSWORD
			&& process.env.ES_GRANT_TYPE
			&& process.env.ES_OAUTH_SECRET
			&& process.env.ES_CLIENT_ID
		);
	}

	async login() {
		this.authorization = await this.getCookie();
		this.accessToken = await this.getAuth();
	}

	isLoggedin() {
		// returns false if cookie or accesstoken is falsy
		return !!this.authorization && !!this.accessToken;
	}

	async GET(data) {
		const limit = data.query.$limit || 9;
		const skip = data.query.$skip || 0;
		const searchWord = data.query.searchQuery || 'img'; // will give pictures of flowers as default
		const contentType = data.query.contentType || 'FILES';// enum:[FILES,FILES_AND_FOLDERS,COLLECTIONS,ALL]

		if (!this.checkEnv()) {
			return 'Update your env variables. See --> src/services/edusharing/envTemplate';
		}

		if (this.isLoggedin() === false) {
			await this.login();
		}
		const options = {
			method: 'POST',
			// This will be changed later with a qs where sorting, filtering etc is present.
			// eslint-disable-next-line max-len
			url: `${process.env.ES_DOMAIN}/edu-sharing/rest/search/v1/queriesV2/mv-repo.schul-cloud.org/mds/ngsearch/?contentType=${contentType}&skipCount=${skip}&maxItems=${limit}&sortProperties=score&sortProperties=cm%3Amodified&sortAscending=false&sortAscending=false&propertyFilter=-all-&`,
			headers: { ...EduSharingConnector.headers, cookie: this.authorization },
			body: JSON.stringify({
				criterias: [
					{ property: 'ngsearchword', values: [`${searchWord}`] },
				],
				facettes: ['cclom:general_keyword'],
			}),
			timeout: REQUEST_TIMEOUT,
		};


		const eduResponse = await request(options);
		const parsed = JSON.parse(eduResponse);

		// adds accesstoken to image-url to let user see the picture on client-side.
		if (parsed && parsed.nodes) {
			parsed.nodes.forEach((node) => {
				if (node.preview && node.preview.url) {
					node.preview.url += `&accessToken=${this.accessToken}`;
				}
			});
		}
		return parsed;
	}

	static get Instance() {
		if (!EduSharingConnector.instance) {
			return new EduSharingConnector();
		}
		return EduSharingConnector.instance;
	}
}

module.exports = EduSharingConnector.Instance;
