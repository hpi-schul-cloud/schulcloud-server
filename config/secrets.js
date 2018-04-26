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
		"region": "eu-de",
		"endpointUrl": process.env.AWS_ENDPOINT_URL,
		"cors_rules": [{
		"AllowedHeaders": ["*"],
		"AllowedMethods": ["PUT"],
		"AllowedOrigins": ["https://schul-cloud.org", "https://schulcloud.org", "https://schul.tech"],
		"MaxAgeSeconds": 300
	}]
},
	"authentication": process.env.AUTHENTICATION,
	"valid_Tokens": process.env.VALID_TOKENS || "example"
};

module.exports = secrets;
