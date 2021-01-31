const { getDefaultFileStorageType } = require('./common');

module.exports = (context) => {
    context.data.fileStorageType = getDefaultFileStorageType();
    return context;
};
