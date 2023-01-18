import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakModule } from '@shared/infra/identity-management/keycloak/keycloak.module';
import { ServerModule } from '@src/modules/server';
import { KeycloakPasswordCredentialsService } from './keycloak-password-credentials.service';
import { KeycloakAdministrationService } from './keycloak-administration.service';

describe('KeycloakPasswordCredentialsService Integration', () => {
	let module: TestingModule;
	let kcPasswordCredentialsService: KeycloakPasswordCredentialsService;
	let kcAdministrationService: KeycloakAdministrationService;
	let isKeycloakReachable: boolean;

	const testRealm = 'test-realm';

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [KeycloakModule, ServerModule],
		}).compile();
		kcPasswordCredentialsService = module.get(KeycloakPasswordCredentialsService);
		kcAdministrationService = module.get(KeycloakAdministrationService);
		isKeycloakReachable = await kcAdministrationService.testKcConnection();
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(async () => {
		if (isKeycloakReachable) {
			const kc = await kcAdministrationService.callKcAdminClient();
			await kc.realms.create({ realm: testRealm, editUsernameAllowed: true });
			kc.setConfig({ realmName: testRealm });
		}
	});

	afterEach(async () => {
		if (isKeycloakReachable) {
			const kc = await kcAdministrationService.callKcAdminClient();
			await kc.realms.del({ realm: testRealm });
		}
	});

	describe('checkCredentials', () => {
		describe('when entering valid credentials', () => {
			const setup = async () => {
				const username = 'john.doe';
				const password = 'password';
				const kc = await kcAdministrationService.callKcAdminClient();
				await kc.users.create({
					username,
					credentials: [
						{
							type: 'password',
							value: password,
						},
					],
				});
				return { username, password };
			};

			it('should return jwt', async () => {
				if (!isKeycloakReachable) return;
				const { username, password } = await setup();
				const jwt = await kcPasswordCredentialsService.checkCredentials(username, password);
				expect(jwt).toBeDefined();
			});
		});

		describe('when entering invalid credentials', () => {
			const setup = () => {
				const username = 'john.doe';
				const password = 'password';
				return { username, password };
			};

			it('should return undefined', async () => {
				if (!isKeycloakReachable) return;
				const { username, password } = setup();
				const jwt = await kcPasswordCredentialsService.checkCredentials(username, password);
				expect(jwt).not.toBeDefined();
			});
		});
	});
});
