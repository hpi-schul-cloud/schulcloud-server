const request = require('request-promise-native');

const getCookie = async (context) => {
	let response;
	const regexp = /^JSESSIONID=|[a-f\d]{32}$/;
	const url = 'https://mv-repo.schul-cloud.org/edu-sharing/rest/authentication/v1/validateSession';
	const userName = process.env.eduUserName || 'admin';
	const pw = process.env.eduPassword || '';
	const headers = {
		Accept: 'application/json',
		'Content-type': 'application/json',
		Authorization: `Basic ${Buffer.from(`${userName}:${pw}`).toString('base64')}`,
	};
	const options = {
		url,
		method: 'GET',
		headers,
		resolveWithFullResponse: true,
	};
	try {
		response = await request(options);
	} catch (err) {
		console.error('ERROR: ', err);
	}
	const cookie = response.statusCode === 200 ? response.headers['set-cookie'][0].slice(0, 43) : '';
	// checks if cookie is correctly formatted
	if (!regexp.test(cookie)) {
		const cookieError = new Error(
			`Incorrect cookie format. Expected "JSESSIONID=hexademicalValueHere",
			 instead got: ${JSON.stringify(cookie)}`,
		);
		console.error(cookieError);
		return context;
	}

	context.arguments[0].headers['Content-type'] = 'application/json';
	context.arguments[0].headers['content-type'] = 'application/json';
	context.arguments[0].headers.Accept = 'application/json';
	context.arguments[0].headers.accept = 'application/json';
	context.arguments[0].headers.Cookie = cookie;
	console.log(cookie, '<---- COOKIE');
	return context;
};

module.exports = { getCookie };
