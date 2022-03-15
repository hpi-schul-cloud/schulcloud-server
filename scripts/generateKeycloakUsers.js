const fs = require('node:fs');
const uuid = require('uuid');
const accounts = require('../backup/setup/accounts.json');
const users = require('../backup/setup/users.json');

function createKeycloakUser(account, user, secret, roles, groups) {
	return {
		id: uuid.v1().valueOf(),
		createdTimestamp: new Date().valueOf(),
		username: account.username,
		enabled: true,
		totp: false,
		emailVerified: false,
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.email,
		credentials: [
			{
				id: uuid.v1().valueOf(),
				type: 'password',
				createdDate: new Date().valueOf(),
				secretData: secret,
				credentialData: '{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}',
			},
		],
		disableableCredentialTypes: [],
		requiredActions: [],
		realmRoles: roles,
		notBefore: 0,
		groups,
	};
}

const realm = { realm: 'dBildungscloud', users: [] };
const accountAndUser = accounts.map((account) => {
	const user = users.find((tempUser) => tempUser.email === account.username);

	if (!user || user.email === 'superhero@schul-cloud.org') {
		return null;
	}
	return [account, user];
});

accountAndUser
	.filter((au) => au != null)
	.forEach((au) => {
		const [account, user] = au;

		realm.users.push(
			createKeycloakUser(
				account,
				user,
				'{"value":"7m5OVwjETIGMLCdXmfngm4+0SRJUHClALAnvMEUGOLGlol1CdninCBKra97DTGXxpw8hkYX5qR0053zODoj/8Q==","salt":"WMd+Vxyuf+E9sq+hYUcKVw==","additionalParameters":{}}',
				['default-roles-dbildunscloud'],
				['/schulcloud-server']
			)
		);
	});

// adds the superhero user
realm.users.push(
	createKeycloakUser(
		{ username: 'superhero@schul-cloud.org' },
		{ firstName: 'Super', lastName: 'Hero', email: 'superhero@schul-cloud.org' },
		'{"value":"7m5OVwjETIGMLCdXmfngm4+0SRJUHClALAnvMEUGOLGlol1CdninCBKra97DTGXxpw8hkYX5qR0053zODoj/8Q==","salt":"WMd+Vxyuf+E9sq+hYUcKVw==","additionalParameters":{}}',
		['default-roles-dbildunscloud'],
		['/superhero-dashboard']
	)
);

// adds the realm administrator
const realmAdmin = createKeycloakUser(
	{ username: 'dbildungscloud' },
	{ firstName: null, lastName: null, email: null },
	'{"value":"xBUgVdY9dbNQXpAhLx4XwCldoj6IHvIq1wjiVOK6oss1muWtMuC/FIWTUZGlImPC4qLrLFLlFC23V5SliDtLrg==","salt":"tTvCXSbJj9K/TcQC57coZQ==","additionalParameters":{}}',
	['default-roles-dbildunscloud'],
	[]
);
realmAdmin.clientRoles = { 'realm-management': ['realm-admin'] };
realm.users.push(realmAdmin);

fs.writeFile('./backup/keycloak/dBildungscloud-users-0.json', JSON.stringify(realm, null, 2), (err) => {
	if (err) throw err;

	console.log('Generated Keycloak users.');
});
