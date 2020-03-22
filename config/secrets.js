const awsEndpointUrls = process.env.AWS_ENDPOINT_URL.split(',');
const awsAccessKeyIds = process.env.AWS_ACCESS_KEY.split(',');
const awsSecretAccessKeys = process.env.AWS_SECRET_ACCESS_KEY.split(',');
const awsRegions = process.env.AWS_REGION.split(',');

const secrets = {
	smtp: process.env.SMTP,
	sendmail: {
		host: process.env.SMTP_HOST,
		port: process.env.SMTP_PORT,
	},
	aws: [...Array(awsEndpointUrls.length).keys()].map((i) => ({
		signatureVersion: 'v4',
		s3ForcePathStyle: true,
		sslEnabled: true,
		accessKeyId: awsAccessKeyIds[i],
		secretAccessKey: awsSecretAccessKeys[i],
		region: awsRegions[i] || 'eu-de',
		endpointUrl: awsEndpointUrls[i],
		cors_rules: [{
			AllowedHeaders: ['*'],
			AllowedMethods: ['PUT'],
			AllowedOrigins: [process.env.HOST],
			MaxAgeSeconds: 300,
		}],
	})),
	authentication: process.env.AUTHENTICATION,
};

module.exports = secrets;
