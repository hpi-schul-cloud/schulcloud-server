const axios = require('axios');
const sanitizeHtml = require('sanitize-html');
const { Configuration } = require('@hpi-schul-cloud/commons');

const { Forbidden, GeneralError, NotFound, Unavailable } = require('../../../errors');
const logger = require('../../../logger');
const EduSharingResponse = require('./EduSharingResponse');
const { getCounty } = require('../helpers');

const ES_METADATASET =
	Configuration.get('FEATURE_ES_MERLIN_ENABLED') ||
	Configuration.get('FEATURE_ES_COLLECTIONS_ENABLED') ||
	Configuration.get('FEATURE_ES_SEARCHABLE_ENABLED')
		? 'mds_oeh'
		: 'mds';
const ES_ENDPOINTS = {
	NODE: `${Configuration.get('ES_DOMAIN')}/edu-sharing/rest/node/v1/nodes/-home-/`,
	SEARCH: `${Configuration.get('ES_DOMAIN')}/edu-sharing/rest/search/v1/queries/-home-/${ES_METADATASET}/ngsearch`,
	RENDERER: `${Configuration.get('ES_DOMAIN')}/edu-sharing/rest/rendering/v1/details/-home-/`,
};

class EduSharingConnector {
	setup(app) {
		this.app = app;
	}

	async getUserForSchool(schoolId) {
		const county = await getCounty(schoolId);
		let user = Configuration.get('ES_USER');
		if (county && county.countyId && county.countyId >= 3000 && county.countyId < 4000) {
			// county id 3XXX == Lower Saxony
			user = `LowerSaxonyCounty${county.countyId}`;
		}
		return user;
	}

	async eduSharingRequest(options, user, retried = false) {
		const secretOptions = { ...options };
		if (secretOptions.headers === undefined) {
			secretOptions.headers = {};
		}
		const password = Configuration.get('ES_PASSWORD');
		secretOptions.headers.Authorization = `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;

		try {
			if (secretOptions.method.toUpperCase() === 'GET') {
				return await axios.get(secretOptions.url, secretOptions);
			}
			if (secretOptions.method.toUpperCase() === 'POST') {
				return await axios.post(secretOptions.url, secretOptions.data, secretOptions);
			}
			return null;
		} catch (err) {
			if (err.statusCode === 404) {
				// more recent edusharing versions return empty 200 instead
				return null;
			}
			const { headers, ...filteredOptions } = options;
			if (retried === true) {
				throw new GeneralError(
					`Edu-Sharing finally failed request with error ${err.statusCode} ${err.message}. No more retries`,
					filteredOptions
				);
			} else {
				logger.error(
					`Edu-Sharing failed request with error ${err.statusCode} ${err.message}, retrying...`,
					filteredOptions
				);
				const response = await this.eduSharingRequest(options, user, true);
				return response;
			}
		}
	}

	async getImage(url, user) {
		const options = {
			url,
			method: 'GET',
			// necessary to get the image as binary value
			responseType: 'arraybuffer',
			// edu-sharing returns 302 to an error page instead of 403,
			// and the error page has wrong status codes
			maxRedirects: 0,
		};

		try {
			const response = await this.eduSharingRequest(options, user);
			const encodedData = `data:image;base64,${response.data.toString('base64')}`;
			return Promise.resolve(encodedData);
		} catch (err) {
			logger.error(`Edu-Sharing failed fetching image ${url}`, err, options);
			return Promise.reject(err);
		}
	}

	async GET(uuid, schoolId) {
		if (!schoolId) {
			throw new Forbidden(`Missing school ${schoolId}`);
		}
		if (!this.validateUuid(uuid)) {
			throw new NotFound(`Invalid node id ${uuid}`);
		}

		const user = await this.getUserForSchool(schoolId);

		const criteria = [];
		criteria.push({ property: 'ngsearchword', values: [''] });
		criteria.push({
			property: 'ccm:replicationsourceuuid',
			values: [uuid],
		});

		const result = await this.searchEduSharing(user, criteria, 0, 1);

		if (!result.data || result.data.length === 0) {
			throw new NotFound(`Item not found, uuid ${uuid}`);
		}

		if (result.data.length !== 1) {
			throw new NotFound(`more items than one found for uuid: ${uuid}`);
		}

		return result.data[0];
	}

	async FIND({ searchQuery = '', $skip, $limit, sortProperties = 'score', collection = '' }, schoolId) {
		let sortAscending = 'false';

		if (!schoolId) {
			throw new Forbidden('Missing school');
		}
		const user = await this.getUserForSchool(schoolId);

		const maxItems = parseInt($limit, 10) || 9;
		const skipCount = parseInt($skip, 10) || 0;

		if ((searchQuery.trim().length < 2 && !collection) || (collection !== '' && !this.validateUuid(collection))) {
			return new EduSharingResponse();
		}

		const criteria = [];

		if (Configuration.get('FEATURE_ES_SEARCHABLE_ENABLED') && !collection) {
			criteria.push({
				property: 'ccm:hpi_searchable',
				values: ['1'],
			});
		}

		if (Configuration.get('FEATURE_ES_COLLECTIONS_ENABLED') === false) {
			// causes 500 responses from server; remove?
			criteria.push({
				property: 'ccm:hpi_lom_general_aggregationlevel',
				values: ['1'],
			});
		} else if (collection) {
			sortProperties = 'cclom:title';
			sortAscending = 'true';
			criteria.push({ property: 'ngsearchword', values: [''] });
			criteria.push({
				property: 'ccm:hpi_lom_relation',
				values: [`{'kind': 'ispartof', 'resource': {'identifier': ['${collection}']}}`],
			});
		} else {
			criteria.push({ property: 'ngsearchword', values: [searchQuery.toLowerCase()] });
		}

		const result = await this.searchEduSharing(user, criteria, skipCount, maxItems, sortProperties);
		return result;
	}

	async searchEduSharing(user, criteria, skipCount, maxItems, sortProperties = 'score', sortAscending = 'false') {
		const searchEndpoint = ES_ENDPOINTS.SEARCH;
		const url = `${searchEndpoint}?${[
			`contentType=FILES`,
			`skipCount=${skipCount}`,
			`maxItems=${maxItems}`,
			`sortProperties=${sortProperties}`,
			`sortAscending=${sortAscending}`,
			`propertyFilter=-all-`,
		].join('&')}`;

		const facets = ['cclom:general_keyword'];

		const data = {
			criteria,
			facets,
		};

		const options = {
			url,
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-type': 'application/json',
			},
			data,
			timeout: Configuration.get('REQUEST_OPTION__TIMEOUT_MS'),
		};

		try {
			const response = await this.eduSharingRequest(options, user);
			const parsed = response.data;
			if (parsed && parsed.nodes) {
				const promises = parsed.nodes.map(async (node) => {
					if (node.preview && node.preview.url) {
						node.preview.url = await this.getImage(`${node.preview.url}&crop=true&maxWidth=300&maxHeight=300`, user);
					}

					// workaround for Edu-Sharing bug, where keywords are like "['a,b,c', 'd \n']"
					if (
						node.properties &&
						node.properties['cclom:general_keyword'] &&
						node.properties['cclom:general_keyword'][0]
					) {
						const keywords = [];
						for (const dirtyKeyword of node.properties['cclom:general_keyword']) {
							for (const keyword of dirtyKeyword.split(',')) {
								keywords.push(keyword.trim());
							}
						}
						node.properties['cclom:general_keyword'] = keywords;
					}
				});
				await Promise.allSettled(promises);
			} else {
				return new EduSharingResponse();
			}

			return new EduSharingResponse(parsed);
		} catch (err) {
			logger.error('Edu-Sharing failed search ', err.message);
			return Promise.reject(err);
		}
	}

	async getPlayerForNode(nodeUuid) {
		const url = `${ES_ENDPOINTS.RENDERER}${nodeUuid}`;
		const options = {
			method: 'GET',
			url,
			headers: {
				Accept: 'application/json',
			},
		};
		const user = Configuration.get('ES_USER');

		const response = await this.eduSharingRequest(options, user);
		const parsed = response.data;
		if (parsed && typeof parsed.detailsSnippet === 'string') {
			return this.getH5Piframe(parsed.detailsSnippet);
		}
		throw new Unavailable(`Unexpected response from Edu-Sharing renderer.`);
	}

	validateUuid(uuid) {
		const uuidV5Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		const uuidV4Regex = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
		return uuidV4Regex.test(uuid) === true || uuidV5Regex.test(uuid) === true;
	}

	getH5Piframe(html) {
		const cleanTags = sanitizeHtml(html, {
			allowedTags: ['iframe', 'script'],
			allowVulnerableTags: true,
			allowedAttributes: {
				iframe: ['src'],
				script: ['src'],
			},
		});

		const iframeSrc = /<iframe src="(.*?)"><\/iframe>/g.exec(cleanTags);
		const scriptSrc = /<script src="(.*?)"><\/script>/g.exec(cleanTags);

		if (!(Array.isArray(iframeSrc) && iframeSrc[1] && Array.isArray(scriptSrc) && scriptSrc[1])) {
			throw new Unavailable(`No data detected in Edu-Sharing renderer response.`);
		}

		const iframeH5P = { iframe_src: iframeSrc[1], script_src: scriptSrc[1] };
		return iframeH5P;
	}
}

module.exports = new EduSharingConnector();
