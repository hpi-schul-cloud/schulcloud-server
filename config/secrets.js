const { Configuration } = require('@hpi-schul-cloud/commons');

const {
	HOST,
	AWS_ACCESS_KEY,
	AWS_SECRET_ACCESS_KEY,
	AWS_REGION,
	AWS_ENDPOINT_URL,
	AUTHENTICATION,
} = require('./globals');

const secrets = {
	smtp: Configuration.get('SMTP'),
	sendmail: {
		host: Configuration.get('SMTP_HOST'),
		port: Configuration.get('SMTP_PORT'),
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
	authentication: AUTHENTICATION,
};

module.exports = secrets;
