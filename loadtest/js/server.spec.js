import http from 'k6/http';
import { check } from 'k6';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
	vus: 10,
	duration: '5m',
};

function getAccessToken() {
	console.info('getting access token...');
	const response = http.post(
		'http://api-svc.default-ew-545-load-tests.svc.cluster.local:3030/api/v3/authentication/local',
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
	return response.json();
}

export function setup() {
	const response = getAccessToken();
	return response;
}

export default function (data) {
	const response = http.get(
		`http://api-svc.default-ew-545-load-tests.svc.cluster.local:3030/api/v3/account?type=username&value=${randomString(
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
