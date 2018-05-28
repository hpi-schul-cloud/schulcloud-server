'use strict';

const modelService = require('./model-service');
const batchImportService = require('./batch-import-service');

module.exports = function () {
    const app = this;

    //setup model services
    app.configure(modelService);
    //setup batch import services
    app.configure(batchImportService);
};