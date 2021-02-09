
const { copyObject, deleteObjects } = require('../../repo/fileStorageProvider.repo');

const createCopyParamsToMarkAsBeingDeleted = (bucket, fileId) => {
    return {
        Bucket: bucket,
        CopySource: `/${bucket}/${fileId}`,
        Key: `expiring_${fileId}`,
        MetadataDirective: 'REPLACE',
        Metadata: {
            expires: true,
        }
    };
}

const createDeleteParams = (bucket, fileIds) => {
    return {
        Bucket: bucket,
        Delete: {
            Objects: fileIds.map((fileId) => ({
                Key: fileId,
            })),
        },
    };
}

const storageBucketName = (schoolId) => 'bucket-' + schoolId;

const moveFilesToTrash = async (schoolId, fileIds) {
    // TODO error handling

	const schoolFacade = facadeLocator.facade('school/v2');
	const storageProvider = schoolFacade.getStorageProviderForSchool(schoolId);
	const bucket = storageBucketName(schoolId);

    const parallelRequests = 100; // we can experiment with inc-/decreasing this. Max 1000 for the delete request
    for (let processedFiles = 0; processedFiles < fileIds.length; processedFiles += parallelRequests) {
        const fileIdSubset = fileIds.slice(processedFiles, processedFiles + parallelRequests);
        // eslint-disable-next-line no-await-in-loop
        const copyResult = await Promise.all(
            fileIdSubset.map((fileId) => {
                const copyParams = createCopyParamsToMarkAsBeingDeleted(bucket, fileId);
                return copyObject(storageProvider, copyParams);
            })
        );
        const deleteParams = createDeleteParams(bucket, fileIdSubset);
        // eslint-disable-next-line no-await-in-loop
        const deleteResult = await deleteObjects(storageProvider, deleteParams).promise();
    }
    return true;
}

module.exports = { moveFilesToTrash };

