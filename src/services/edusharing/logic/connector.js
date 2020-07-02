const REQUEST_TIMEOUT = 8000; // ms
const request = require('request-promise-native');
const { Configuration } = require('@schul-cloud/commons');
const { GeneralError } = require('@feathersjs/errors');
const logger = require('../../../logger');

const ES_PATH = {
	AUTH: '/edu-sharing/rest/authentication/v1/validateSession',
	NODE: '/edu-sharing/rest/node/v1/nodes/mv-repo.schul-cloud.org/',
	SEARCH: '/edu-sharing/rest/search/v1/queriesV2/mv-repo.schul-cloud.org/mds/ngsearch/',
	TOKEN: '/edu-sharing/oauth2/token',
};

class EduSharingConnector {
	constructor() {
		if (EduSharingConnector.instance) {
			return EduSharingConnector.instance;
		}
		this.authorization = null; /* JSESSION COOKIE */
		this.accessToken = null; /* ACCESSTOKEN */
		EduSharingConnector.instance = this;
	}

	static get headers() {
		return {
			Accept: 'application/json',
			'Content-type': 'application/json',
		};
	}

	static get authorization() {
		const headers = {
			...EduSharingConnector.headers,
			Authorization: `Basic ${Buffer.from(`${Configuration.get('ES_USER')
			}:${Configuration.get('ES_PASSWORD')}`).toString(
				'base64',
			)}`,
		};

		return headers;
	}


	// gets cookie (JSESSION) and attach it to header
	getCookie() {
		const cookieOptions = {
			uri: `${Configuration.get('ES_DOMAIN')}${ES_PATH.AUTH}`,
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
				logger.error('error: ', err);
			});
	}

	// gets access_token and refresh_token
	getAuth() {
		const oauthoptions = {
			method: 'POST',
			url: `${Configuration.get('ES_DOMAIN')}${ES_PATH.TOKEN}`,
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },

			body: `grant_type=${Configuration.get('ES_GRANT_TYPE')}&client_id=${
				Configuration.get('ES_CLIENT_ID')
			}&client_secret=${Configuration.get('ES_OAUTH_SECRET')}&username=${
				Configuration.get('ES_USER')
			}&password=${Configuration.get('ES_PASSWORD')}`,
			timeout: REQUEST_TIMEOUT,
		};
		return request(oauthoptions).then((result) => {
			if (result) {
				const parsedResult = JSON.parse(result);
				return Promise.resolve(parsedResult.access_token);
			}
			return Promise.reject(new GeneralError('Oauth failed'));
		});
	}

	allConfigurationValuesHaveBeenDefined() {
		return (
			Configuration.has('ES_DOMAIN')
			&& Configuration.has('ES_USER')
			&& Configuration.has('ES_PASSWORD')
			&& Configuration.has('ES_GRANT_TYPE')
			&& Configuration.has('ES_OAUTH_SECRET')
			&& Configuration.has('ES_CLIENT_ID')
		);
	}

	async requestRepeater(options) {
		let retry = 0;
		const errors = [];
		do {
			try {
				const eduResponse = await request(options);
				return JSON.parse(eduResponse);
			} catch (e) {
				if (e.statusCode === 401) {
					logger.info(`Trying to renew Edu Sharing connection. Attempt ${retry}`);
					await this.login();
				} else {
					logger.error(e);
					errors.push(e);
				}
			}
			retry += 1;
		} while (retry < 3);

		throw new GeneralError('Edu Sharing Retry failed', errors);
	}


	async login() {
		this.authorization = await this.getCookie();
		this.accessToken = await this.getAuth();
	}

	isLoggedin() {
		// returns false if cookie or accesstoken is falsy
		return !!this.authorization && !!this.accessToken;
	}

	async GET(id, params) {

		if (this.isLoggedin() === false) {
			await this.login();
		}

		const propertyFilter = '-all-';

		const options = {
			method: 'GET',
			// eslint-disable-next-line max-len
			url: `${Configuration.get('ES_DOMAIN')
			}${ES_PATH.NODE}${id
			}/metadata?propertyFilter=${propertyFilter}`,
			headers: {
				...EduSharingConnector.headers,
				cookie: this.authorization,
			},
			timeout: REQUEST_TIMEOUT,
		};

		const eduResponse = await this.requestRepeater(options);
		return eduResponse.node;
	}

	async FIND({
		query: {
			searchQuery = '',
			contentType = 'FILES',
			$skip,
			$limit,
			sortProperties = 'score',
		},
	}) {
		const skipCount = parseInt($skip, 10) || 0;
		const maxItems = parseInt($limit, 10) || 9;
		const sortAscending = false;
		const propertyFilter = '-all-'; // '-all-' for all properties OR ccm-stuff
		if (searchQuery.trim().length < 2) {
			return {
				total: 0,
				limit: 0,
				skip: 0,
				data: [],
			};
		}

		if (this.isLoggedin() === false) {
			await this.login();
		}

		const urlBase = `${Configuration.get('ES_DOMAIN')}${ES_PATH.SEARCH}?`;
		const url = urlBase
			+ [
				`contentType=${contentType}`,
				`skipCount=${skipCount}`,
				`maxItems=${maxItems}`,
				`sortProperties=${sortProperties}`,
				`sortAscending=${sortAscending}`,
				`propertyFilter=${propertyFilter}`,
			].join('&');

		const options = {
			method: 'POST',
			// This will be changed later with a qs where sorting, filtering etc is present.
			// eslint-disable-next-line max-len
			url,
			headers: {
				...EduSharingConnector.headers,
				cookie: this.authorization,
			},
			body: JSON.stringify({
				criterias: [
					{ property: 'ngsearchword', values: [`${searchQuery}`] },
				],
				facettes: ['cclom:general_keyword'],
			}),
			timeout: REQUEST_TIMEOUT,
		};

		const parsed = await this.requestRepeater(options);

		// adds accesstoken to image-url to let user see the picture on client-side.
		if (parsed && parsed.nodes) {
			parsed.nodes.forEach((node) => {
				if (node.preview && node.preview.url) {
					node.preview.url += `&accessToken=${this.accessToken}`;
				}
			});
		}

		return {
			total: parsed.pagination.total,
			limit: parsed.pagination.count,
			skip: parsed.pagination.from,
			data: parsed.nodes,
		};
	}


	static get Instance() {
		if (!EduSharingConnector.instance) {
			return new EduSharingConnector();
		}
		return EduSharingConnector.instance;
	}
}

module.exports = EduSharingConnector.Instance;
