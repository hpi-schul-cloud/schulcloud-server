const aws = require('aws-sdk');
const CryptoJS = require('crypto-js');
const { Configuration } = require('@hpi-schul-cloud/commons');

const { alert, error } = require('../src/logger');
const { facadeLocator } = require('../src/utils/facadeLocator');

const appPromise = require('../src/app');

const trashbinModel = require('../src/components/user/repo/db/trashbin.schema');
const fileStorageProviderRepo = require('../src/components/fileStorage/repo/fileStorageProvider.repo');

const backupPeriodThreshold = new Date()
backupPeriodThreshold.setDate(backupPeriodThreshold.getDate() - 0);

const decryptAccessKey = (secretAccessKey) => {
	const S3_KEY = Configuration.get('S3_KEY');
	return CryptoJS.AES.decrypt(secretAccessKey, S3_KEY).toString(CryptoJS.enc.Utf8);
};

const filesToBeDeletedAggregate = [
	// filter by data older then the defined backup period
	{
		$match: {
			createdAt: {
				$lt: backupPeriodThreshold,
			},
		},
	},
	// unwind the trashbin data of all users
	{
		$unwind: {
			path: '$data',
		},
	},
	// discard unneeded data
	{
		$project: {
			data: 1,
		},
	},
	// filter by trashbin data regarding file deletion
	{
		$match: {
			'data.scope': 'files',
		},
	},
	// unwind files
	{
		$unwind: {
			path: '$data.data',
		},
	},
];

const getSchoolIdForFile = async (file) => {
	const userId = file.refOwnerModel === 'user' && file.owner;
	if (!userId) return null;

	const trashbinObjects = await trashbinModel.find({ userId: userId });
	if (trashbinObjects.length < 1) return null;

	const userData = trashbinObjects[0].data.find((d) => d.scope === 'user');
	if (!userData) return null;

	return userData.data.schoolId;
};

const deleteFiles = async () => {
	const schoolFacade = facadeLocator.facade('school/v2');

	const filesToBeDeleted = trashbinModel.aggregate(filesToBeDeletedAggregate);
	for await (const file of filesToBeDeleted) {
		const fileData = file.data.data;
		alert('file to be deleted: ' + fileData.storageFileName);

		const schoolId = await getSchoolIdForFile(fileData);
		if (!schoolId) {
			// ToDo: Error handling
			continue;
		}
		const storageProviderId = await schoolFacade.getStorageProviderIdForSchool(schoolId);
		const storageProviderInfo = await fileStorageProviderRepo.getStorageProviderMetaInformation(storageProviderId);
		// storageProviderInfo.secretAccessKey = decryptAccessKey(storageProviderInfo.secretAccessKey);
		const storageProvider = fileStorageProviderRepo.private.createStorageProviderInstance(storageProviderInfo);

		const bucketName = `bucket-${schoolId}`;

        const fileName = `expiring_${fileData.storageFileName}`;
		alert('going to delete file ' + fileName + ' in bucket ' + bucketName);

		await storageProvider.deleteObject({ Bucket: bucketName, Key: fileName }).promise();
	}
};

appPromise
	.then(async () => {
		alert('start script');
		await deleteFiles();
		// await trashbinModel.deleteMany({ createdAt: { $lt: backupPeriodThreshold }});
        return process.exit(0);
	})
	.catch((error) => {
		console.error(error);
		return process.exit(1);
	});
