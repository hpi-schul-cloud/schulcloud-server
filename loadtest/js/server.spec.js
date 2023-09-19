import http from 'k6/http';
import { check } from 'k6';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
	vus: 1000,
	duration: '2m',
};

function getAccessToken() {
	console.info('getting access token...');
	const response = http.post(
		'https://dev.loadtest-01.dbildungscloud.dev/api/v3/authentication/local',
		JSON.stringify({
			username: 'superhero@schul-cloud.org',
			password: 'Schulcloud1!',
		}),
		{
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
	console.info(response);
	const result = response.json();
	return result;
}

export function setup() {
	const response = getAccessToken();
	return response;
}

export default function (data) {
	const response = http.get(
		`https://dev.loadtest-01.dbildungscloud.dev/api/v3/account?type=username&value=${randomString(
			2,
			'abcdefghijklmnopqrstuvwxyz'
		)}`,
		{
			headers: {
				Authorization: `Bearer ${data.accessToken}`,
			},
			timeout: '10s',
		}
	);
	check(response, {
		'response status 200': (res) => res.status === 200,
	});

	if (response.status === 401) {
		data.accessToken = getAccessToken();
	}
}
