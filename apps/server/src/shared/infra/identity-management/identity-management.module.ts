import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Module } from '@nestjs/common';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { KeycloakIdentityManagement } from './keycloak-identity-management';

@Module({
	providers: [
		{ provide: 'IdentityManagement', useClass: KeycloakIdentityManagement },
		{ provide: 'KeycloakAdminClient', useClass: KeycloakAdminClient },
		{
			provide: 'KeycloakSettings',
			useValue: {
				baseUrl: Configuration.get('IDENTITY_MANAGEMENT__URI') as string,
				realmName: Configuration.get('IDENTITY_MANAGEMENT__TENANT') as string,
				credentials: {
					grantType: 'password',
					username: Configuration.get('IDENTITY_MANAGEMENT__ADMIN_USER') as string,
					password: Configuration.get('IDENTITY_MANAGEMENT__ADMIN_PASSWORD') as string,
					clientId: Configuration.get('IDENTITY_MANAGEMENT__ADMIN_CLIENTID') as string,
				},
			},
		},
	],
	exports: ['IdentityManagement'],
})
export class IdentityManagementModule {}
