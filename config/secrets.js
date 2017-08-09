let secrets = {
	"smtp": process.env.SMTP,
	"sendmail": {
		"host": process.env.SMTP_HOST,
		"port": process.env.SMTP_PORT
},
	"aws": {
	"signatureVersion": "v4",
		"s3ForcePathStyle": true,
		"sslEnabled": true,
		"accessKeyId": process.env.AWS_ACCESS_KEY,
		"secretAccessKey": process.env.AWS_SECRET_ACCESS_KEY,
		"region": "eu-west-1",
		"endpointUrl": process.env.AWS_ENDPOINT_URL,
		"cors_rules": [{
		"AllowedHeaders": ["*"],
		"AllowedMethods": ["PUT"],
		"AllowedOrigins": ["https://schul-cloud.org", "https://schulcloud.org", "https://schul.tech"],
		"MaxAgeSeconds": 300
	}]
},
	"authentication": process.env.AUTHENTICATION
};

module.exports = secrets;
