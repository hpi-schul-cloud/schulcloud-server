const aws = require('aws-sdk');
const logger = require('../../../logger');

// todo: use production config
let awsConfig;
try {
	awsConfig = require('../../../../config/secrets.json').aws;
} catch (e) {
	logger.log('warning', 'The AWS config couldn\'t be read');
	awsConfig = {};
}

const createAWSObject = (schoolId) => {
	if (!awsConfig.endpointUrl) throw new Error('AWS integration is not configured on the server');
	const config = new aws.Config(awsConfig);
	config.endpoint = new aws.Endpoint(awsConfig.endpointUrl);
	const bucketName = `bucket-${schoolId}`;
	const s3 = new aws.S3(config);
	return { s3, bucket: bucketName };
};

// todo: read all schools from production-db dump
const schoolId = '0000d186816abba584714c5f';


const awsObject = createAWSObject(schoolId);
const params = {
	Bucket: awsObject.bucket,
	Prefix: '/',
};

// todo: list all files for all school-buckets
awsObject.s3.listObjectsV2(params, (/* err, data */) => {

	// todo: copy all files to route-folder (flat)

	// todo: save meta-data in proxy db
});
