const secrets = {
	smtp: process.env.SMTP,
	sendmail: {
		host: process.env.SMTP_HOST,
		port: process.env.SMTP_PORT,
	},
	aws: {
		signatureVersion: 'v4',
		s3ForcePathStyle: true,
		sslEnabled: true,
		accessKeyId: process.env.AWS_ACCESS_KEY || 'S3RVER',
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'S3RVER',
		region: process.env.AWS_REGION || 'eu-de',
		endpointUrl: process.env.AWS_ENDPOINT_URL || 'http://localhost:9001',
		cors_rules: [{
			AllowedHeaders: ['*'],
			AllowedMethods: ['PUT'],
			AllowedOrigins: ['https://schul-cloud.org', 'https://schulcloud.org', 'https://schul.tech'],
			MaxAgeSeconds: 300,
		}],
	},
	authentication: process.env.AUTHENTICATION,
};

module.exports = secrets;
