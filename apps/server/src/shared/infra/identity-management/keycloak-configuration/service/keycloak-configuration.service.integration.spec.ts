import { createMock } from '@golevelup/ts-jest';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import AuthenticationExecutionExportRepresentation from '@keycloak/keycloak-admin-client/lib/defs/authenticationExecutionExportRepresentation';
import AuthenticationFlowRepresentation from '@keycloak/keycloak-admin-client/lib/defs/authenticationFlowRepresentation';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { SystemRepo } from '@shared/repo';
import { systemFactory } from '@shared/testing/factory';
import { LoggerModule } from '@src/core/logger';
import { SystemMapper } from '@src/modules/system/mapper/system.mapper';
import { SystemService } from '@src/modules/system/service/system.service';
import { KeycloakAdministrationService } from '../../keycloak-administration/service/keycloak-administration.service';
import { KeycloakConfigurationModule } from '../keycloak-configuration.module';
import { KeycloakConfigurationService } from './keycloak-configuration.service';

describe('KeycloakConfigurationService Integration', () => {
	let module: TestingModule;
	let keycloak: KeycloakAdminClient;
	let keycloakAdministrationService: KeycloakAdministrationService;
	let keycloakConfigurationService: KeycloakConfigurationService;
	let isKeycloakAvailable = false;

	const testRealm = 'test-realm';
	const flowAlias = 'Direct Broker Flow';
	const systemServiceMock = createMock<SystemService>();
	const systems = SystemMapper.mapFromEntitiesToDtos(systemFactory.withOidcConfig().buildList(2));

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				KeycloakConfigurationModule,
				LoggerModule,
				MongoMemoryDatabaseModule.forRoot(),
				ConfigModule.forRoot({
					isGlobal: true,
					validationOptions: { infer: true },
				}),
			],
			providers: [SystemRepo],
		})
			.overrideProvider(SystemService)
			.useValue(systemServiceMock)
			.compile();
		keycloakAdministrationService = module.get(KeycloakAdministrationService);
		keycloakConfigurationService = module.get(KeycloakConfigurationService);
		isKeycloakAvailable = await keycloakAdministrationService.testKcConnection();
		if (isKeycloakAvailable) {
			keycloak = await keycloakAdministrationService.callKcAdminClient();
		}
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(async () => {
		if (isKeycloakAvailable) {
			await keycloak.realms.create({ realm: testRealm, enabled: true });
			keycloak.setConfig({ realmName: testRealm });
		}
	});

	afterEach(async () => {
		if (isKeycloakAvailable) {
			await keycloak.realms.del({ realm: testRealm });
		}
	});

	// Execute this test for a test run against a running Keycloak instance
	describe('configureBrokerFlows', () => {
		it('should configure broker flows', async () => {
			if (!isKeycloakAvailable) return;

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

	describe('configureClient', () => {
		describe('when keycloak is available', () => {
			it('should add dbildungscloud-server client to keycloak', async () => {
				if (!isKeycloakAvailable) return;

				await keycloakConfigurationService.configureClient();
				const kc = await keycloakAdministrationService.callKcAdminClient();
				const clientId = keycloakAdministrationService.getClientId();
				const clients = await kc.clients.find({ clientId });
				expect(clients).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							clientId,
						}),
					])
				);
			});
		});
	});

	describe('configureIdentityProviders', () => {
		describe('when keycloak is available', () => {
			it('should sync identity providers to keycloak', async () => {
				if (!isKeycloakAvailable) return;

				systemServiceMock.findByType.mockResolvedValueOnce(systems);
				await keycloakConfigurationService.configureIdentityProviders();
				const kc = await keycloakAdministrationService.callKcAdminClient();
				const identityProviders = await kc.identityProviders.find();
				expect(identityProviders.length).toEqual(systems.length);
			});
		});
	});

	describe('configureRealm', () => {
		describe('when keycloak is available', () => {
			it('should configure realm to allow edit user names', async () => {
				if (!isKeycloakAvailable) return;

				await keycloakConfigurationService.configureRealm();
				const kc = await keycloakAdministrationService.callKcAdminClient();
				const realm = await kc.realms.findOne({ realm: testRealm });
				expect(realm).toEqual(
					expect.objectContaining({
						realm: testRealm,
						editUsernameAllowed: true,
					})
				);
			});
		});
	});
});
