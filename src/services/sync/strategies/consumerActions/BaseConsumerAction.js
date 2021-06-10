const { NotImplemented, SyncError, BadRequest } = require('../../../../errors');
const { batchFilterKeys } = require('../../utils');

const securedKeys = ['type', 'getType', 'matchType', 'filterData', 'exec', 'action', 'getSecuredKeys'];

class BaseConsumerAction {
	constructor(type, options) {
		if (!type) {
			throw new NotImplemented('The type must set for consumer actions.');
		}
		this.filterActive = true;
		this.type = type;
		this.allowedLogKeys = options.allowedLogKeys || null;
	}

	/**
	 * @public
	 * @returns {Array[string]}
	 */
	getSecuredKeys() {
		return securedKeys;
	}

	/**
	 * @public
	 * @returns {string}
	 */
	getType() {
		return this.type;
	}

	/**
	 * @private
	 * @param {string} type
	 * @returns {boolean}
	 */
	matchType(type) {
		return this.getType() === type;
	}

	/**
	 * @private
	 * @param {object} data
	 * @returns {Promise}
	 */
	// eslint-disable-next-line no-unused-vars
	async action(data = {}) {
		throw new NotImplemented('Must be implemented');
	}

	/**
	 * @private
	 * @param {object} data
	 * @returns {object}
	 */
	filterData(data) {
		return batchFilterKeys(data, this.allowedLogKeys);
	}

	/**
	 * @public
	 * @param {object} content
	 * @returns {Promise}
	 */
	async exec({ action, data, syncId } = {}) {
		if (!this.matchType(action)) {
			throw new BadRequest(`The ${action} is not the supported message action.`);
		}

		return this.action(data).catch((err) => {
			const filteredData = this.filterActive ? this.filterData(data) : data;
			throw new SyncError(this.getType(), err, {
				data: filteredData,
				syncId,
			});
		});
	}
}

module.exports = BaseConsumerAction;
