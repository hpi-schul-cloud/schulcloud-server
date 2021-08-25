const aws = require('aws-sdk');
const CryptoJS = require('crypto-js');
const { Configuration } = require('@hpi-schul-cloud/commons');

const { error } = require('../src/logger');
const { facadeLocator } = require('../../../utils/facadeLocator');

const appPromise = require('../src/app');

const trashbinModel = require('../src/components/user/repo/db/trashbin.schema');
const fileStorageProviderRepo = require('../src/components/fileStorage/repo/fileStorageProvider.repo');

const backupPeriod = 7 * 24 * 60 * 60 * 1000 // 7 days

const decryptAccessKey = (secretAccessKey) => {
	const S3_KEY = Configuration.get('S3_KEY');
	return CryptoJS.AES.decrypt(secretAccessKey, S3_KEY).toString(CryptoJS.enc.Utf8);
};

const filesToBeDeletedAggregate = [
    // filter by data older then the defined backup period
    {
        '$match': {
            'createdAt': {
                '$lt': new Date(Date.now - backupPeriod)
            }
        }
    },
    // unwind the trashbin data of all users
    {
        '$unwind': {
            'path': '$data'
        }
    },
    // discard unneeded data
    {
        '$project': {
            'data': 1
        }
    },
    // filter by trashbin data regarding file deletion
    {
        '$match': {
            'data.scope': 'files'
        }
    },
    // unwind files
    {
        '$unwind': {
            'path': '$data.data'
        }
    }
];

const getSchoolIdForFile = async (file) => {
    const userId = (file.refOwnerModel === 'user') && owner;
    if (!userId) return null;

    const trashbinObject = await trashbinModel.find({userId: userId});
    const userData = trashbinObject.data.find(d => d.scope === 'user');
    if (!userData) return null;

    return userData.data.schoolId;
};

const deleteFiles = async () => {
    const schoolFacade = facadeLocator.facade('school/v2');

    const filesToBeDeleted = trashbinModel.aggregate(filesToBeDeletedAggregate);
    for await (const file of filesToBeDeleted) {
        const fileData = file.data.data;
        const schoolId = await getSchoolIdForFile(fileData);
        if (!bucket) {
            // ToDo: Error handling
            continue;
        }
        const storageProviderId = await schoolFacade.getStorageProviderIdForSchool(schoolId);
        const storageProviderInfo = await fileStorageProviderRepo.getStorageProviderMetaInformation(storageProviderId);
        storageProviderInfo.secretAccessKey = decryptAccessKey(storageProviderInfo.secretAccessKey);
        const storageProvider = fileStorageProviderRepo.private.createStorageProviderInstance(storageProviderInfo);

        const bucketName = `bucket-${schoolId}`;

        await storageProvider.deleteObject({'Bucket': bucketName, Key: fileData.storageFileName});
    }
};


appPromise
    .then(async () => {
        await deleteFiles();
        await trashbinModel.deleteMany({ createdAt: {'$lt': new Date(Date.now - backupPeriod)} })
    })
