import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { AccountUc } from '../../../../account/uc/account.uc';
import { RoleService } from '../../../../role';
import { SchoolService } from '../../../../school';
import { UserService } from '../../../../user';
import { ExternalSchoolDto } from '../../../dto';
import { OidcProvisioningService } from './oidc-provisioning.service';

describe('OidcProvisioningService', () => {
	let module: TestingModule;
	let service: OidcProvisioningService;

	let userService: DeepMocked<UserService>;
	let schoolService: DeepMocked<SchoolService>;
	let roleService: DeepMocked<RoleService>;
	let accountUc: DeepMocked<AccountUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OidcProvisioningService,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
				{
					provide: AccountUc,
					useValue: createMock<AccountUc>(),
				},
			],
		}).compile();

		service = module.get(OidcProvisioningService);
		userService = module.get(UserService);
		schoolService = module.get(SchoolService);
		roleService = module.get(RoleService);
		accountUc = module.get(AccountUc);
	});

	afterAll(async () => {
		await module.close();
	});

	const setupData = () => {
		const systemId = 'SystemId';
		const externalSchoolDto: ExternalSchoolDto = new ExternalSchoolDto({
			externalId: 'externalId',
			name: 'name',
			officialSchoolNumber: 'officialSchoolNumber',
		});

		return {
			systemId,
			externalSchoolDto,
		};
	};

	describe('provisionExternalSchool is called', () => {
		describe('when ExternalschoolDto and systemId is given', () => {
			it('should save the school', () => {});
		});
	});
});
