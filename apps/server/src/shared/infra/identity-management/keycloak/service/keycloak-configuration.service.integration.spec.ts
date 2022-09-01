import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { SystemRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { ConfigModule } from '@nestjs/config';
import AuthenticationFlowRepresentation from '@keycloak/keycloak-admin-client/lib/defs/authenticationFlowRepresentation';
import AuthenticationExecutionExportRepresentation from '@keycloak/keycloak-admin-client/lib/defs/authenticationExecutionExportRepresentation';
import { KeycloakModule } from '../keycloak.module';
import { KeycloakAdministrationService } from './keycloak-administration.service';
import { KeycloakConfigurationService } from './keycloak-configuration.service';

describe('KeycloakConfigurationService Integration', () => {
	const flowAlias = 'Direct Broker Flow';
	let module: TestingModule;
	let keycloakAdministrationService: KeycloakAdministrationService;
	let keycloakConfigurationService: KeycloakConfigurationService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				KeycloakModule,
				LoggerModule,
				MongoMemoryDatabaseModule.forRoot(),
				ConfigModule.forRoot({
					isGlobal: true,
					validationOptions: { infer: true },
				}),
			],
			providers: [SystemRepo],
		}).compile();
		keycloakAdministrationService = module.get(KeycloakAdministrationService);
		keycloakConfigurationService = module.get(KeycloakConfigurationService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(keycloakAdministrationService).toBeDefined();
		expect(keycloakConfigurationService).toBeDefined();
	});

	// Execute this test for a test run against a running Keycloak instance
	describe('configureBrokerFlows', () => {
		it('should configure broker flows', async () => {
			if (!(await keycloakAdministrationService.testKcConnection())) {
				return;
			}

			const kc = await keycloakAdministrationService.callKcAdminClient();
			const getFlowsRequest = kc.realms.makeRequest<{ realmName: string }, AuthenticationFlowRepresentation[]>({
				method: 'GET',
				path: '/{realmName}/authentication/flows',
				urlParamKeys: ['realmName'],
			});

			await keycloakConfigurationService.configureBrokerFlows();
			const flow = (await getFlowsRequest({ realmName: kc.realmName })).find(
				(tempFlow) => tempFlow.alias === flowAlias
			);
			expect(flow).toEqual(
				expect.objectContaining<AuthenticationFlowRepresentation>({
					providerId: 'basic-flow',
					alias: flowAlias,
					description: 'First broker login which automatically creates or maps accounts.',
					topLevel: true,
					builtIn: false,
					authenticationExecutions: expect.arrayContaining<AuthenticationExecutionExportRepresentation>([
						expect.objectContaining<AuthenticationExecutionExportRepresentation>({
							authenticator: 'idp-create-user-if-unique',
							requirement: 'ALTERNATIVE',
							priority: 0,
							autheticatorFlow: false,
							userSetupAllowed: false,
						}) as AuthenticationExecutionExportRepresentation,
						expect.objectContaining<AuthenticationExecutionExportRepresentation>({
							authenticator: 'idp-auto-link',
							requirement: 'ALTERNATIVE',
							priority: 1,
							autheticatorFlow: false,
							userSetupAllowed: false,
						}) as AuthenticationExecutionExportRepresentation,
					]) as AuthenticationExecutionExportRepresentation[],
				})
			);
		});
	});
});
