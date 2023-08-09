import http from 'k6/http';
import { check } from 'k6';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
	vus: 10,
	duration: '1m',
};

function getAccessToken() {
	console.info('getting access token');
	const response = http.post(
		'http://erwinidm-svc.default-ew-545-load-tests.svc.cluster.local:8089/realms/master/protocol/openid-connect/token',
		{
			username: '6ZMpMnidfquiZVo7rrPj',
			password: 'EUP6oH9LLzy8LAqm0j4o',
			grant_type: 'password',
			client_id: 'admin-cli',
		},
		{
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		}
	);
	return response.json().access_token;
}

export function setup() {
	return { accessToken: getAccessToken() };
}

export default function (data) {
	const response = http.get(
		`http://erwinidm-svc.default-ew-545-load-tests.svc.cluster.local:8089/admin/realms/default/users?email=${randomString(
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
