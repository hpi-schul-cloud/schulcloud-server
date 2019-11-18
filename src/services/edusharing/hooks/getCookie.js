const request = require('request-promise-native');

const getCookie = async (context) => {
	const regexp = /^JSESSIONID=|[a-f\d]{32}$/;
	const url = 'https://mv-repo.schul-cloud.org/edu-sharing/rest/search/v1/custom/';
	const options = {
		url,
		method: 'GET',
	};
	let cookie = '';
	try {
		await request(options);
	} catch (err) {
		// grabs the cookie (JSESSIONID) from headers if statuscode is 401 unauthorized
		cookie = err.response.statusCode === 401 ? err.response.headers['set-cookie'][0].slice(0, 43) : '';
	}
	// checks if cookie is correctly formatted
	if (!regexp.test(cookie)) {
		const cookieError = new Error([
			`Incorrect cookie format from edu-sharing api. Expected "JSESSIONID=hexademicalValueHere", instead got: ${JSON.stringify(cookie)}`]);
		return cookieError;
	}
	context.arguments[0].headers['content-type'] = 'application/json';
	context.arguments[0].headers.Cookie = cookie;

	console.log(context.arguments[0].headers.Cookie, '<== SESSIONID from hook!');

	return context;
};

module.exports = { getCookie };
