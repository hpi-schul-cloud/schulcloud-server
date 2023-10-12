import http from 'k6/http';
import { check } from 'k6';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
	noConnectionReuse: false,
	stages: [
		{ duration: '2m', target: 25 },
		{ duration: '3m', target: 50 },
		{ duration: '10m', target: 100 },
		{ duration: '5m', target: 50 },
	],
};

function getAccessToken() {
	const response = http.post(
		'https://dev.loadtest-01.dbildungscloud.dev/api/v3/authentication/local',
		JSON.stringify({
			username: '<user name for load test>',
			password: '<password for load test>',
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
		'response status in 200s': (res) => res.status >= 200 && res.status <= 299,
		'response status in 400s': (res) => res.status >= 400 && res.status <= 499,
		'response status in 500s': (res) => res.status >= 500 && res.status <= 599,
	});

	if (response.status === 401) {
		data.accessToken = getAccessToken();
	}
}
