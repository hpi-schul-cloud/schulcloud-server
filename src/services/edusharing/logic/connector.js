const { Configuration } = require('@schul-cloud/commons');
const reqlib = require('app-root-path').require;
const { request } = require('../../../utils/request');

const { GeneralError } = reqlib('src/errors');
const logger = require('../../../logger');
const EduSearchResponse = require('./EduSearchResponse');

const RETRY_ERROR_CODES = [401, 403];
const COOKIE_RENEWAL_PERIOD_MS = 1800000; // 30 min
const NO_PERMISSIONS_IMG = '/edu-sharing/themes/default/images/common/mime-types/previews/no-permissions.svg';

const ES_PATH = {
	AUTH: '/edu-sharing/rest/authentication/v1/validateSession',
	NODE: '/edu-sharing/rest/node/v1/nodes/mv-repo.schul-cloud.org/',
	SEARCH: '/edu-sharing/rest/search/v1/queriesV2/mv-repo.schul-cloud.org/mds/ngsearch/',
	TOKEN: '/edu-sharing/oauth2/token',
};

// file deepcode ignore StaticAccessThis: <Deepcode confuses values and methods>
// file deepcode ignore PromiseNotCaughtNode: <Catch exists on line 90>
// file deepcode ignore AttrAccessOnNull: <Accessing attr nodes on line 248>

let lastCookieRenewalTime = null;

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
			Authorization: `Basic ${Buffer.from(
				`${Configuration.get('ES_USER')}:${Configuration.get('ES_PASSWORD')}`
			).toString('base64')}`,
		};

		return headers;
	}

	// gets cookie (JSESSION) and attach it to header
	getCookie() {
		const cookieOptions = {
			url: `${Configuration.get('ES_DOMAIN')}${ES_PATH.AUTH}`,
			headers: EduSharingConnector.authorization,
			resolveWithFullResponse: true,
		};
		return request(cookieOptions)
			.then((result) => {
				if (result.status !== 200 || result.data.isValidLogin !== true) {
					throw Error('authentication error with edu sharing');
				}
				return result.headers['set-cookie'][0];
			})
			.catch((err) => {
				logger.error(`Couldn't get edusharing cookie: ${err.status} ${err.message}`);
			});
	}

	// gets access_token and refresh_token
	async getAuth() {
		const oauthoptions = {
			method: 'POST',
			url: `${Configuration.get('ES_DOMAIN')}${ES_PATH.TOKEN}`,
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },

			data: `grant_type=${Configuration.get('ES_GRANT_TYPE')}&client_id=${Configuration.get(
				'ES_CLIENT_ID'
			)}&client_secret=${Configuration.get('ES_OAUTH_SECRET')}&username=${Configuration.get(
				'ES_USER'
			)}&password=${Configuration.get('ES_PASSWORD')}`,
		};
		try {
			const data = await request(oauthoptions);
			return data.access_token;
		} catch (e) {
			return new GeneralError('Oauth failed', e);
		}
	}

	async requestRepeater(options) {
		let retry = 0;
		const errors = [];
		do {
			try {
				// eslint-disable-next-line no-await-in-loop
				return await request(options);
			} catch (e) {
				if (RETRY_ERROR_CODES.indexOf(e.status) >= 0) {
					logger.info(`Trying to renew Edu Sharing connection. Attempt ${retry}`);
					// eslint-disable-next-line no-await-in-loop
					await this.login();
				} else if (e.status === 404) {
					return null;
				} else {
					logger.error(`Edusharing error occurred ${e.status} ${e.message}`);
					errors.push(e);
				}
			}
			retry += 1;
		} while (retry < 3);

		throw new GeneralError('Edu Sharing Retry failed', errors);
	}

	async login() {
		logger.info('Renewal of Edusharing credentials');
		this.authorization = await this.getCookie();
		this.accessToken = await this.getAuth();
	}

	shouldRelogin() {
		const nextCookieRenewalTime = lastCookieRenewalTime
			? new Date(lastCookieRenewalTime.getTime() + COOKIE_RENEWAL_PERIOD_MS)
			: new Date();
		// should relogin if cookie expired or cookie or access token is empty
		const shouldRelogin = new Date() >= nextCookieRenewalTime || !this.authorization || !this.accessToken;
		if (shouldRelogin) {
			lastCookieRenewalTime = new Date();
		}
		return shouldRelogin;
	}

	async getImage(url, retry = true) {
		const reqOptions = {
			url,
			headers: {},
			// necessary to get the image as binary value
			responseType: 'arraybuffer',
			resolveWithFullResponse: true,
		};
		return request(reqOptions)
			.then((response) => {
				// edusharing sometimes doesn't return error code if access token is expired
				// but redirect to no permission image
				if (retry && response.request.path === NO_PERMISSIONS_IMG) {
					return this.tryToGetImageWithNewAccessToken(url);
				}
				const encodedData = `data:image;base64,${response.data.toString('base64')}`;
				return encodedData;
			})
			.catch((err) => {
				// todo check statusCode exists
				if (retry && RETRY_ERROR_CODES.indexOf(err.status) >= 0) {
					return this.tryToGetImageWithNewAccessToken(url);
				}
				logger.error(`Couldn't fetch image for ${url}:
				Edusharing responded with ${err.status} ${err.message}`);
				throw err;
			});
	}

	async tryToGetImageWithNewAccessToken(url) {
		logger.info('Trying to renew Edusharing access token.');
		this.accessToken = await this.getAuth();
		const urlObj = new URL(url);
		urlObj.searchParams.set('accessToken', this.accessToken);
		return this.getImage(urlObj.toString(), false);
	}

	async GET(id) {
		if (this.shouldRelogin()) {
			await this.login();
		}
		const propertyFilter = '-all-';

		const options = {
			url: `${Configuration.get('ES_DOMAIN')}${ES_PATH.NODE}${id}/metadata?propertyFilter=${propertyFilter}`,
			headers: {
				...EduSharingConnector.headers,
				cookie: this.authorization,
			},
		};

		const eduResponse = await this.requestRepeater(options);
		const { node } = eduResponse;
		if (node && node.preview && node.preview.url) {
			// eslint-disable-next-line max-len
			node.preview.url = await this.getImage(
				`${node.preview.url}&accessToken=${this.accessToken}&crop=true&maxWidth=1200&maxHeight=800`
			);
		}
		return node;
	}

	async FIND({ query: { searchQuery = '', contentType = 'FILES', $skip, $limit, sortProperties = 'score' } }) {
		const skipCount = parseInt($skip, 10) || 0;
		const maxItems = parseInt($limit, 10) || 9;
		const sortAscending = false;
		const propertyFilter = '-all-'; // '-all-' for all properties OR ccm-stuff
		if (searchQuery.trim().length < 2) {
			return new EduSearchResponse();
		}

		if (this.shouldRelogin()) {
			await this.login();
		}

		const urlBase = `${Configuration.get('ES_DOMAIN')}${ES_PATH.SEARCH}?`;
		const url =
			urlBase +
			[
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
			data: JSON.stringify({
				criterias: [{ property: 'ngsearchword', values: [`${searchQuery.toLowerCase()}`] }],
				facettes: ['cclom:general_keyword'],
			}),
		};

		const parsed = await this.requestRepeater(options);

		if (parsed && parsed.nodes) {
			const promises = parsed.nodes.map(async (node) => {
				if (node.preview && node.preview.url) {
					node.preview.url = await this.getImage(`${node.preview.url}
					&accessToken=${this.accessToken}&crop=true&maxWidth=300&maxHeight=300`);
				}
			});
			await Promise.allSettled(promises);
		} else {
			return new EduSearchResponse();
		}

		return new EduSearchResponse(parsed);
	}

	static get Instance() {
		if (!EduSharingConnector.instance) {
			return new EduSharingConnector();
		}
		return EduSharingConnector.instance;
	}
}

module.exports = EduSharingConnector.Instance;
