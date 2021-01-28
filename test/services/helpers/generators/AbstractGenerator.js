module.exports = class AbstractGenerator {
    constructor(app) {
        if (new.target===AbstractGenerator) {
            throw new TypeError('Cannot construct Abstract instances directly');
        }
        this._app = app;
        this._createdEntitiesIds = [];
        this._service = undefined;
    }

    async create(data, params = {}) {
        const result = await this._service.create(data, params);
        this._createdEntitiesIds.push(result._id);
        return result;
    }

    get created() {
        return this._createdEntitiesIds;
    }

    get rawService() {
        return this._service;
    }

    /**
     * default implementation for cleanup
     * @returns {Promise<void>}
     */
    async cleanup(params) {
        if (this._createdEntitiesIds.length===0) {
            return;
        }
        await Promise.all(this._createdEntitiesIds.map(id => this._service.remove(id, params)));
        this._createdEntitiesIds = [];
    }
};