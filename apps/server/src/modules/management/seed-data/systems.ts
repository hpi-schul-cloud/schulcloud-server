/* eslint-disable no-template-curly-in-string */
import { SystemEntityProps } from '@modules/system/entity';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { systemEntityFactory } from '@shared/testing';
import { DeepPartial } from 'fishery';

type SystemPartial = DeepPartial<SystemEntityProps> & {
	id?: string;
	createdAt?: string;
	updatedAt?: string;
};

const data: SystemPartial[] = [
	{
		id: '62c7f233f35a554ba3ed42f1',
		updatedAt: '2022-07-12T14:01:58.588Z',
		type: 'ldap',
		provisioningStrategy: SystemProvisioningStrategy.OIDC,
		alias: 'oidcmock',
		displayName: 'OIDCMOCK',
		oidcConfig: {
			idpHint: 'oidcmock',
			clientId: '${OIDCMOCK__CLIENT_ID}',
			clientSecret: '${OIDCMOCK__CLIENT_SECRET}',
			authorizationUrl: '${OIDCMOCK__BASE_URL}/connect/authorize',
			tokenUrl: '${OIDCMOCK__BASE_URL}/connect/token',
			logoutUrl: '${OIDCMOCK__BASE_URL}/connect/endsession',
			userinfoUrl: '${OIDCMOCK__BASE_URL}/connect/userinfo',
			defaultScopes: 'openid profile email',
		},
		ldapConfig: {
			providerOptions: {
				userAttributeNameMapping: {
					givenName: 'givenName',
					sn: 'sn',
					uuid: 'uuid',
					uid: 'uid',
					mail: 'mail',
					role: 'memberOf',
					dn: 'dn',
				},
				roleAttributeNameMapping: {
					roleStudent: 'cn=ROLE_STUDENT,ou=roles,o=schoolOne0,dc=de,dc=example,dc=org',
					roleTeacher: 'cn=ROLE_TEACHER,ou=roles,o=schoolOne0,dc=de,dc=example,dc=org',
					roleAdmin: 'cn=ROLE_ADMIN,ou=roles,o=schoolOne0,dc=de,dc=example,dc=org',
					roleNoSc: 'cn=ROLE_NBC_EXCLUDE,ou=roles,o=schoolOne0,dc=de,dc=example,dc=org',
				},
				classAttributeNameMapping: {
					dn: 'dn',
				},
				userPathAdditions: 'ou=users',
				roleType: 'group',
				schoolName: 'OIDCMOCK School',
			},
			url: 'ldap://127.0.0.1:389',
			rootPath: 'o=schoolOne0,dc=de,dc=example,dc=org',
			searchUser: 'cn=admin,dc=example,dc=org',
			searchUserPassword: 'admin',
			provider: 'general',
			federalState: '0000b186816abba584714c53',
			active: true,
		},
	},
];

export function generateSystems(injectEnvVars: (s: string) => string) {
	const systems = data.map((d) => {
		d = JSON.parse(injectEnvVars(JSON.stringify(d))) as typeof d;
		const params: DeepPartial<SystemEntityProps> = {
			alias: d.alias,
			displayName: d.displayName,
			type: d.type,
			provisioningStrategy: d.provisioningStrategy,
			oidcConfig: d.oidcConfig,
			ldapConfig: d.ldapConfig,
			oauthConfig: d.oauthConfig,
			provisioningUrl: d.provisioningUrl,
			url: d.url,
		};
		const system = systemEntityFactory.buildWithId(params, d.id);

		if (d.createdAt) system.createdAt = new Date(d.createdAt);
		if (d.updatedAt) system.updatedAt = new Date(d.updatedAt);

		return system;
	});

	return systems;
}
