const request = require('request-promise-native');

const getCookie = async (context) => {
	let response;
	const url = 'https://mv-repo.schul-cloud.org/edu-sharing/rest/authentication/v1/validateSession';
	const userName = process.env.eduUserName || 'admin';
	const pw = process.env.eduPassword || 'Jei8aThoo1aiKo0k';
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
	const cookie = response.headers['set-cookie'][0];

	console.log(cookie, '<---- COOKIE');
	return context;
};

module.exports = { getCookie };
