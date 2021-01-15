const {
	HOST,
	SMTP,
	SMTP_HOST,
	SMTP_PORT,
	AWS_ACCESS_KEY,
	AWS_SECRET_ACCESS_KEY,
	AWS_REGION,
	AWS_ENDPOINT_URL,
	AUTHENTICATION,
} = require('./globals');

const secrets = {
	smtp: SMTP,
	sendmail: {
		host: SMTP_HOST,
		port: SMTP_PORT,
	},
	aws: {
		signatureVersion: 'v4',
		s3ForcePathStyle: true,
		sslEnabled: true,
		accessKeyId: AWS_ACCESS_KEY,
		secretAccessKey: AWS_SECRET_ACCESS_KEY,
		region: AWS_REGION,
		endpointUrl: AWS_ENDPOINT_URL,
		cors_rules: [
			{
				AllowedHeaders: ['*'],
				AllowedMethods: ['PUT'],
				AllowedOrigins: [HOST],
				MaxAgeSeconds: 300,
			},
		],
	},
	IDAS_API_KEY : "<insert API Key here ;) >",
	authentication: AUTHENTICATION,
};

module.exports = secrets;
