const request = require('request-promise-native');
const { Configuration } = require('@hpi-schul-cloud/commons');

const { Forbidden, GeneralError, NotFound } = require('../../../errors');
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
	AUTH: `${Configuration.get('ES_DOMAIN')}/edu-sharing/rest/authentication/v1/validateSession`,
	NODE: `${Configuration.get('ES_DOMAIN')}/edu-sharing/rest/node/v1/nodes/-home-/`,
	SEARCH: `${Configuration.get('ES_DOMAIN')}/edu-sharing/rest/search/v1/queries/-home-/${ES_METADATASET}/ngsearch`,
};

class EduSharingConnector {
	setup(app) {
		this.app = app;
	}

	async getBasicAuthHeaders(schoolId) {
		const county = await getCounty(schoolId);
		let user = Configuration.get('ES_USER');
		if (county && county.countyId && county.countyId >= 3000 && county.countyId < 4000) {
			// county id 3XXX -> Lower Saxony
			user = `LowerSaxonyCounty${county.countyId}`;
		}
		const password = Configuration.get('ES_PASSWORD');
		const credentials = Buffer.from(`${user}:${password}`).toString('base64');
		return {
			Authorization: `Basic ${credentials}`,
		};
	}

	async eduSharingRequest(options, retried = false) {
		try {
			// await this.authorize(); TODO: replace
			if (options.method.toUpperCase() === 'GET') {
				return await request.get(options);
			}
			if (options.method.toUpperCase() === 'POST') {
				return await request.post(options);
			}
			return null;
		} catch (err) {
			if (err.statusCode === 404) {
				// more recent edusharing version return empty 200 instead
				return null;
			}
			logger.error(`Edu-Sharing failed request with error ${err.statusCode} ${err.message}`, options);
			if (retried === true) {
				throw new GeneralError('Edu-Sharing Request failed');
			} else {
				const response = await this.eduSharingRequest(options, true);
				return response;
			}
		}
	}

	async getImage(schoolId, url) {
		const options = {
			uri: url,
			method: 'GET',
			headers: await this.getBasicAuthHeaders(schoolId),
			encoding: null, // necessary to get the image as binary value
			resolveWithFullResponse: true,
			// edu-sharing returns 302 to an error page instead of 403,
			// and the error page has wrong status codes
			followRedirect: false,
		};

		try {
			const result = await this.eduSharingRequest(options);
			const encodedData = `data:image;base64,${result.body.toString('base64')}`;
			return Promise.resolve(encodedData);
		} catch (err) {
			logger.error(`Edu-Sharing failed fetching image ${url}`, err, options);
			return Promise.reject(err);
		}
	}

	async GET(uuid, schoolId) {
		if (!schoolId) {
			throw new Forbidden('Missing school');
		}
		if (!this.validateUuid(uuid)) {
			throw new NotFound('Invalid node id');
		}

		const criteria = [];
		criteria.push({ property: 'ngsearchword', values: [''] });
		criteria.push({
			property: 'ccm:replicationsourceuuid',
			values: [uuid],
		});

		const response = await this.searchEduSharing(schoolId, criteria, 0, 1);

		if (!response.data || response.data.length !== 1) {
			throw new NotFound('Item not found');
		}

		return response.data[0];
	}

	async FIND({ searchQuery = '', $skip, $limit, sortProperties = 'score', collection = '' }, schoolId) {
		if (!schoolId) {
			throw new Forbidden('Missing school');
		}

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
			criteria.push({ property: 'ngsearchword', values: [''] });
			criteria.push({
				property: 'ccm:hpi_lom_relation',
				values: [`{'kind': 'ispartof', 'resource': {'identifier': ['${collection}']}}`],
			});
		} else {
			criteria.push({ property: 'ngsearchword', values: [searchQuery.toLowerCase()] });
		}

		const response = await this.searchEduSharing(schoolId, criteria, skipCount, maxItems, sortProperties);
		return response;
	}

	async searchEduSharing(schoolId, criteria, skipCount, maxItems, sortProperties = 'score', sortAscending = 'false') {
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

		const body = JSON.stringify({
			criteria,
			facets,
		});

		const options = {
			method: 'POST',
			url,
			headers: {
				Accept: 'application/json',
				'Content-type': 'application/json',
				...(await this.getBasicAuthHeaders(schoolId)),
			},
			body,
			timeout: Configuration.get('REQUEST_OPTION__TIMEOUT_MS'),
		};

		try {
			const response = await this.eduSharingRequest(options);
			const parsed = JSON.parse(response);
			if (parsed && parsed.nodes) {
				const promises = parsed.nodes.map(async (node) => {
					if (node.preview && node.preview.url) {
						node.preview.url = await this.getImage(
							schoolId,
							`${node.preview.url}&crop=true&maxWidth=300&maxHeight=300`
						);
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

	validateUuid(uuid) {
		const uuidV5Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		const uuidV4Regex = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
		return uuidV4Regex.test(uuid) === true || uuidV5Regex.test(uuid) === true;
	}
}

module.exports = new EduSharingConnector();
