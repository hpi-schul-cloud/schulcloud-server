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
	"valid_Tokens": process.env.VALID_TOKENS || [{
		"key": "example",
		"name": "General Client",
		"permissions": {
			"authentication": true,
			"users": true,
			"roles": true,
			"accounts/pwgen": true,
			"accounts": true,
			"accounts/jwt": true,
			"accounts/confirm": true,
			"systems": true,
			"schools": true,
			"resolve/scopes": true,
			"resolve/users": true,
			"courses": true,
			"courseGroups": true,
			"classes": true,
			"grades": true,
			"ltiTools": true,
			"content/resources": true,
			"content/search": true,
			"content/redirect": true,
			"materials": true,
			"calendar": true,
			"lessons": true,
			"lessons/contents/:type": true,
			"fileStorage/directories": true,
			"fileStorage/signedUrl": true,
			"fileStorage/total": true,
			"fileStorage": true,
			"files": true,
			"directories": true,
			"link": true,
			"news": true,
			"newshistory": true,
			"mails": true,
			"homework/copy": true,
			"homework": true,
			"submissions": true,
			"comments": true,
			"federalStates": true,
			"passwordRecovery": true,
			"passwordRecovery/reset": true,
			"notification/messages": true,
			"notification/devices": true,
			"notification/callback": true,
			"notification": true,
			"releases/fetch": true,
			"releases": true,
			"helpdesk": true,
			"statistics": true
		}
	}]
};

module.exports = secrets;
