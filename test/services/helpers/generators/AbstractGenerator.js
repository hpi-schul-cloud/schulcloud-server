module.exports = class AbstractGenerator {
    constructor(app) {
        if (new.target===AbstractGenerator) {
            throw new TypeError('Cannot construct Abstract instances directly');
        }
        this._app = app;
        this._createdEntitiesIds = [];
    }

    async create(data) {
        const result = await this._service.create(data);
        this._createdEntitiesIds.push(result._id);
        return result;
    }

    get created() {
        return this._createdEntitiesIds;
    }

    /**
     * default implementation for cleanup
     * @returns {Promise<void>}
     */
    async cleanup() {
        if (this._createdEntitiesIds.length===0) {
            return;
        }
        await Promise.all(this._createdEntitiesIds.map(id => this._service.remove(id)));
        this._createdEntitiesIds = [];
    }
};