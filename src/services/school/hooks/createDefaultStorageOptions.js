const { NODE_ENV, ENVIRONMENTS } = require('../../../../config/globals');
const getFileStorageStrategy = require('../../fileStorage/strategies').createStrategy;
const { getDefaultFileStorageType } = require('./common');

module.exports = async (context) => {
    // create buckets only in production mode
    if (NODE_ENV!==ENVIRONMENTS.PRODUCTION) {
        return context;
    }
    const storageType = getDefaultFileStorageType();
    const fileStorageStrategy = getFileStorageStrategy(storageType);
    try {
        await fileStorageStrategy.create(context.result._id);
        return context;
    } catch (e) {
        if (e && e.code==='BucketAlreadyOwnedByYou') {
            // The bucket already exists
            context;
        }
        throw e;
    }
};