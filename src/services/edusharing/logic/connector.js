const request = require('request-promise-native');
// const feathersError = require('@feathersjs/errors');
const URL = require('url');

function validURL(str) {
	const pattern = new RegExp('^(https?:\\/\\/)?'
    + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'
    + '((\\d{1,3}\\.){3}\\d{1,3}))'
    + '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'
    + '(\\?[;&a-z\\d%_.~+=-]*)?'
    + '(\\#[-a-z\\d_]*)?$', 'i');
	return !!pattern.test(str);
}


class EduSharingConnector {
	constructor() {
		if (EduSharingConnector.instance) {
			return EduSharingConnector.instance;
		}
		// this.url = process.env.ES_DOMAIN; // todo validate this
		if (!validURL(this.url)) {
			return 'Invalid ES_DOMAIN, check your .env';
		}
		this.authorization = null;
		EduSharingConnector.instance = this;
	}

	static get headers() {
		return {
			Accept: 'application/json',
			'Content-type': 'application/json',
		};
	}

	static get authorization() {
		console.log('Authorizing');
		const userName = process.env.eduUserName || 'admin';
		const pw = process.env.eduPassword || '';

		const headers = Object.assign({}, EduSharingConnector.headers, {
			Authorization: `Basic ${Buffer.from(`${userName}:${pw}`).toString('base64')}`,
		});
		return headers;
	}

	 getCookie() {
		// const url = 'https://www.mv-repo.schul-cloud.org/edu-sharing/rest/authentication/v1/validateSession';
		const cookieOptions = {
			uri: `${process.env.ES_DOMAIN}/edu-sharing/rest/authentication/v1/validateSession`,
			method: 'GET',
			headers: EduSharingConnector.authorization,
			resolveWithFullResponse: true,
		};
		return request(cookieOptions).then((result) => {
			console.log('result', result);
			if (result.statusCode !== 200) {
				throw Error('authentication error with edu sharing');
			}
			return result.headers['set-cookie'][0];
		}).catch((err) => {
			console.error('error: ', err);
		});
	}

	// status() {
	// 	let ok = false;
	// 	try {
	// 		if (this.url && URL.parse(this.url)) {
	// 			ok = true;
	// 		}
	// 		throw Error('ES_DOMAIN not defined');
	// 	} catch (error) {
	// 		console.error('edu sharing ES_DOMAIN not correctly set', error);
	// 	}
	// }

	async login() {
		this.authorization = await this.getCookie();
	}

	isLoggedin() {
		// login valid for timeout
		return !!this.authorization;
	}


	async GET(params, searchValue = 'bunny') {
		// this.status(); // checks if domain is correct
		console.log(searchValue, 'searchValue GET');
		if (this.isLoggedin() === false) {
			await this.login(); // logs user in
		}
		// const requestUrl = new URL(url, path, qs);
		console.log(process.env.ES_DOMAIN, 'https://mv-repo.schul-cloud.org/'); // no https
		const options = {
			method: 'POST',
			url: `${process.env.ES_DOMAIN}/edu-sharing/rest/search/v1/queriesV2/mv-repo.schul-cloud.org/mds/ngsearch/?contentType=FILES&skipCount=0&maxItems=25&sortProperties=score&sortProperties=cm%3Amodified&sortAscending=false&sortAscending=false&propertyFilter=-all-&`,
			headers: Object.assign({}, EduSharingConnector.headers, {
				cookie: this.authorization,
			}),
			body: JSON.stringify({ criterias: [{ property: 'ngsearchword', values: [`${searchValue}`] }], facettes: ['cclom:general_keyword'] }),
		};
		console.log(options.url, 'WTF IS THIS');

		return request(options);

		// eventually repeat it or relogin
	}


	static get Instance() {
		if (!EduSharingConnector.instance) {
			return new EduSharingConnector();
		}
		return EduSharingConnector.instance;
	}
}


module.exports = EduSharingConnector.Instance;
