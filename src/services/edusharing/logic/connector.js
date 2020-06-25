const REQUEST_TIMEOUT = 8000; // ms
const request = require('request-promise-native');
const { Configuration } = require('@schul-cloud/commons');
const { Forbidden, GeneralError } = require('@feathersjs/errors');
const logger = require('../../../logger');


class EduSharingConnector {
	constructor() {
		if (EduSharingConnector.instance) {
			return EduSharingConnector.instance;
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
			uri: `${Configuration.get('ES_DOMAIN')}/edu-sharing/rest/authentication/v1/validateSession`,
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
			url: `${Configuration.get('ES_DOMAIN')}/edu-sharing/oauth2/token`,
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },

			// eslint-disable-next-line max-len
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
				return parsedResult.access_token;
			}
			// eslint-disable-next-line no-console
			console.error('Oauth failed');
			return null;
		});
	}

	allConfigurationValuesHaveBeenDefined() {
		return (
			Configuration.get('ES_DOMAIN')
			&& Configuration.get('ES_USER')
			&& Configuration.get('ES_PASSWORD')
			&& Configuration.get('ES_GRANT_TYPE')
			&& Configuration.get('ES_OAUTH_SECRET')
			&& Configuration.get('ES_CLIENT_ID')
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
				// eslint-disable-next-line no-console
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

	configurationIncompleteError() {
		return new Forbidden(
			'Not all ES_... vars have been defined, update configuration.',
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

	async GET(id, params) {
		if (!this.allConfigurationValuesHaveBeenDefined()) {
			throw this.configurationIncompleteError();
		}

		if (this.isLoggedin() === false) {
			await this.login();
		}

		const propertyFilter = '-all-';

		const options = {
			method: 'GET',
			// eslint-disable-next-line max-len
			url: `${Configuration.get('ES_DOMAIN')
			}/edu-sharing/rest/node/v1/nodes/mv-repo.schul-cloud.org/${id
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

	async FIND(data) {
		const contentType = data.query.contentType || 'FILES'; // enum:[FILES,FILES_AND_FOLDERS,COLLECTIONS,ALL]
		const skipCount = parseInt(data.query.$skip, 10) || 0;
		const maxItems = parseInt(data.query.$limit, 10) || 9;
		const sortProperties = data.query.sortProperties || 'score';
		const sortAscending = false;
		const propertyFilter = '-all-'; // '-all-' for all properties OR ccm-stuff
		const searchWord = data.query.searchQuery || '';

		if (!this.allConfigurationValuesHaveBeenDefined()) {
			throw this.configurationIncompleteError();
		}

		if (this.isLoggedin() === false) {
			await this.login();
		}

		const urlBase = `${Configuration.get('ES_DOMAIN')
		}/edu-sharing/rest/search/v1/queriesV2/mv-repo.schul-cloud.org/mds/ngsearch/?`;
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
					{ property: 'ngsearchword', values: [`${searchWord}`] },
				],
				facettes: ['cclom:general_keyword'],
			}),
			timeout: REQUEST_TIMEOUT,
		};

		const parsed = await this.requestRepeater(options);

		// provided by client eg data.query.filterOptions
		const filterOptions = {
			mimetype: ['text/html', 'image/jpeg'],
			provider: ['BauhausMaterial.de', 'München educationcenter', 'Khan Academy'],
		};

		// filter away everything buy selected mimetype
		const filterMime = (obj, mimetypes) => {
			let result = obj.nodes;
			mimetypes.forEach((type) => { result = result.filter((n) => n.mimeType === type); });
			return result;
		};

		// filter away everything buy selected providers
		const filterProvider = (obj, providers) => obj === providers;

		// adds accesstoken to image-url to let user see the picture on client-side.
		if (parsed && parsed.nodes) {
			parsed.nodes.forEach((node) => {
				if (node.preview && node.preview.url) {
					node.preview.url += `&accessToken=${this.accessToken}`;
				}
			});
		}

		const filterResult = (obj, opt) => {
			let result;
			// checks if user has set type filter
			if (opt.mimetype.length) {
				result = filterMime(obj, opt.mimetype);
			}
			// checks if user has set provider filter
			if (opt.provider.length) {
				result = filterProvider(obj, opt.provider);
			}
			return result;
		};

		// checks if user has set filter options
		/* if (Object.values(filterOptions).length) {
			parsed = filterResult(parsed, filterOptions);
		} */

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
