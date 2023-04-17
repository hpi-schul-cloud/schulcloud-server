import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { UserMigrationService } from '@src/modules/user-login-migration/service/user-migration.service';
import { ProvisioningService } from '@src/modules/provisioning';
import { AuthenticationService } from '@src/modules/authentication/services/authentication.service';
import { OAuthService } from '@src/modules/oauth/service/oauth.service';
import { SchoolMigrationService } from '../service';
import { UserLoginMigrationUc } from './user-login-migration.uc';

describe('UserLoginMigrationUc', () => {
	let module: TestingModule;
	let uc: UserLoginMigrationUc;

	let oAuthService: DeepMocked<OAuthService>;
	let provisioningService: DeepMocked<ProvisioningService>;
	let schoolMigrationService: DeepMocked<SchoolMigrationService>;
	let userMigrationService: DeepMocked<UserMigrationService>;
	let authenticationService: DeepMocked<AuthenticationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserLoginMigrationUc,
				{
					provide: OAuthService,
					useValue: createMock<OAuthService>(),
				},
				{
					provide: ProvisioningService,
					useValue: createMock<ProvisioningService>(),
				},
				{
					provide: SchoolMigrationService,
					useValue: createMock<SchoolMigrationService>(),
				},
				{
					provide: UserMigrationService,
					useValue: createMock<UserMigrationService>(),
				},
				{
					provide: AuthenticationService,
					useValue: createMock<AuthenticationService>(),
				},
			],
		}).compile();

		uc = module.get(UserLoginMigrationUc);
		userMigrationService = module.get(UserMigrationService);
		oAuthService = module.get(OAuthService);
		provisioningService = module.get(ProvisioningService);
		schoolMigrationService = module.get(SchoolMigrationService);
		userMigrationService = module.get(UserMigrationService);
		authenticationService = module.get(AuthenticationService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('migrate', () => {
		describe('when user migrates the from one to another system', () => {
			const setup = () => {};

			it('should return a response', async () => {});
		});
	});
});
