import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakManagementController } from './keycloak-management.controller';
import { KeycloakManagementUc } from '../uc/Keycloak-management.uc';

describe('KeycloakManagementController', () => {
	let controller: KeycloakManagementController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [KeycloakManagementController],
			providers: [
				{
					provide: KeycloakManagementUc,
					useValue: {
						seed(): Promise<number> {
							return Promise.resolve(0);
						},
					},
				},
			],
		}).compile();

		controller = module.get(KeycloakManagementController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	it('should accept calls on seed route', async () => {
		await expect(controller.importSeedData()).resolves.not.toThrow();
	});
});
