const aws = require('aws-sdk');
const logger = require('winston');

// todo: use production config
let awsConfig;
try {
	awsConfig = require("../../../../config/secrets.json").aws;
} catch (e) {
	logger.log('warn', 'The AWS config couldn\'t be read');
	awsConfig = {};
}

const createAWSObject = (schoolId) => {
	if (!awsConfig.endpointUrl) throw new Error('AWS integration is not configured on the server');
	var config = new aws.Config(awsConfig);
	config.endpoint = new aws.Endpoint(awsConfig.endpointUrl);
	let bucketName = `bucket-${schoolId}`;
	var s3 = new aws.S3(config);
	return {s3: s3, bucket: bucketName};
};

// todo: read all schools from production-db dump
let schoolId = "0000d186816abba584714c5f";


let awsObject = createAWSObject(schoolId);
const params = {
    Bucket: awsObject.bucket,
    Prefix: '/'
};

// todo: list all files for all school-buckets
awsObject.s3.listObjectsV2(params, function (err, data) {
    console.log(data);
        
    // todo: copy all files to route-folder (flat)

    // todo: save meta-data in proxy db
});
    