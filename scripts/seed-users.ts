import { faker } from '@faker-js/faker';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';

const host = 'http://127.0.0.1:8080/';
const keycloak = new KeycloakAdminClient({
	baseUrl: host,
	realmName: 'master',
});

async function login(): Promise<void> {
	await keycloak.auth({
		clientId: 'admin-cli',
		grantType: 'password',
		username: 'keycloak',
		password: 'keycloak',
	});
}

async function refresh(): Promise<void> {
	const { access_token, refresh_token } = await (
		await fetch(`http://${host}/realms/master/protocol/openid-connect/token`, {
			method: 'post',
			body: JSON.stringify({
				client_id: 'admin-cli',
				grant_type: 'refresh_token',
				refresh_token: keycloak.refreshToken,
			}),
		})
	).json();
	keycloak.setAccessToken(access_token);
	keycloak.refreshToken = refresh_token;
}

async function createUser(index: number): Promise<void> {
	const firstName = faker.person.firstName();
	const lastName = faker.person.lastName();
	try {
		await keycloak.users.create({
			realm: 'foobar',
			username: `${index}.${lastName}@sp-sh.de`,
			firstName,
			lastName,
			email: `${index}.${lastName}@sp-sh.de`,
		});
	} catch (err) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		if (err.response.status === 401) {
			await refresh();
			await keycloak.users.create({
				realm: 'foobar',
				username: `${index}.${lastName}@sp-sh.de`,
				firstName,
				lastName,
				email: `${index}.${lastName}@sp-sh.de`,
			});
		}
		console.warn(err);
	}
}

async function main(): Promise<void> {
	await login();

	const count = keycloak.users.count({ realm: 'foobar' });
	console.log(`${count} users in the foobar realm.`);

	// for (let i = 0; i < 100; i += 1) {
	// 	const tasks = new Array<Promise<void>>();
	// 	for (let j = 0; j < 1_000; j += 1) {
	// 		tasks.push(createUser(j + j * i));
	// 	}
	// 	await Promise.allSettled(tasks);
	// }
}

main()
	.then(() => console.log('seeded all users'))
	.catch((error) => console.error(error));
