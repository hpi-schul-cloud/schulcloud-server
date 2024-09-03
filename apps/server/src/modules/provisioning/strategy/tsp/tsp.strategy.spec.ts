import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AccountService } from '@modules/account';
import { accountDoFactory } from '@modules/account/testing';
import { RoleService } from '@modules/role';
import { SchoolService } from '@modules/school';
import { schoolFactory } from '@modules/school/testing';
import { UserService } from '@modules/user';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleReference } from '@shared/domain/domainobject';
import { RoleName } from '@shared/domain/interface';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { userDoFactory } from '@shared/testing';
import {
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	OauthDataStrategyInputDto,
	ProvisioningSystemDto,
	TspProvisioningStrategy,
} from '../..';

describe('TspProvisioningStrategy', () => {
	let module: TestingModule;
	let sut: TspProvisioningStrategy;

	let schoolService: DeepMocked<SchoolService>;
	let userService: DeepMocked<UserService>;
	let roleService: DeepMocked<RoleService>;
	let accountService: DeepMocked<AccountService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TspProvisioningStrategy,
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
			],
		}).compile();

		sut = module.get(TspProvisioningStrategy);
		schoolService = module.get(SchoolService);
		userService = module.get(UserService);
		roleService = module.get(RoleService);
		accountService = module.get(AccountService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
		jest.clearAllMocks();
	});

	describe('getType', () => {
		describe('When called', () => {
			it('should return type TSP', () => {
				const result: SystemProvisioningStrategy = sut.getType();

				expect(result).toEqual(SystemProvisioningStrategy.TSP);
			});
		});
	});

	describe('getData', () => {
		describe('When called', () => {
			it('should throw', () => {
				expect(() => sut.getData({} as OauthDataStrategyInputDto)).toThrow();
			});
		});
	});

	describe('apply', () => {
		describe('When user for given data does not exist', () => {
			const setup = () => {
				const school = schoolFactory.build();

				const data: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: faker.string.uuid(),
						provisioningStrategy: SystemProvisioningStrategy.TSP,
					}),
					externalUser: new ExternalUserDto({
						externalId: faker.string.uuid(),
						roles: [RoleName.TEACHER],
						email: faker.internet.email(),
					}),
					externalSchool: new ExternalSchoolDto({ externalId: school.id, name: school.getInfo().name }),
				});

				schoolService.getSchools.mockResolvedValue([school]);
				roleService.findByNames.mockResolvedValue([
					new RoleReference({ id: faker.string.uuid(), name: RoleName.TEACHER }),
				]);
				userService.findByExternalId.mockResolvedValue(null);
				accountService.findByUserId.mockResolvedValue(null);

				return { data };
			};

			it('create user and account', async () => {
				const { data } = setup();

				await expect(sut.apply(data)).resolves.not.toThrow();
				expect(userService.save).toBeCalledTimes(1);
				expect(accountService.saveWithValidation).toBeCalledTimes(1);
			});
		});

		describe('When user for given data does exist', () => {
			const setup = () => {
				const school = schoolFactory.build();
				const user = userDoFactory.build();
				const account = accountDoFactory.build({
					userId: user.id,
				});

				const data: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: faker.string.uuid(),
						provisioningStrategy: SystemProvisioningStrategy.TSP,
					}),
					externalUser: new ExternalUserDto({
						externalId: faker.string.uuid(),
						roles: [RoleName.TEACHER],
						email: user.email,
					}),
					externalSchool: new ExternalSchoolDto({ externalId: school.id, name: school.getInfo().name }),
				});

				schoolService.getSchools.mockResolvedValue([school]);
				roleService.findByNames.mockResolvedValue([]);
				userService.findByExternalId.mockResolvedValue(user);
				userService.save.mockResolvedValue(user);
				accountService.findByUserId.mockResolvedValue(account);

				return { data };
			};

			it('update user and account', async () => {
				const { data } = setup();

				await expect(sut.apply(data)).resolves.not.toThrow();
				expect(userService.save).toBeCalledTimes(1);
				expect(accountService.saveWithValidation).toBeCalledTimes(1);
			});
		});

		describe('When external school is not given', () => {
			const setup = () => {
				const data: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: faker.string.uuid(),
						provisioningStrategy: SystemProvisioningStrategy.TSP,
					}),
					externalUser: new ExternalUserDto({ externalId: faker.string.uuid() }),
				});

				return { data };
			};

			it('should throw error', async () => {
				const { data } = setup();

				await expect(sut.apply(data)).rejects.toThrow();
			});
		});

		describe('When external school does not exist', () => {
			const setup = () => {
				const data: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: faker.string.uuid(),
						provisioningStrategy: SystemProvisioningStrategy.TSP,
					}),
					externalUser: new ExternalUserDto({ externalId: faker.string.uuid() }),
					externalSchool: new ExternalSchoolDto({ externalId: faker.string.uuid(), name: faker.string.alpha() }),
				});

				schoolService.getSchools.mockResolvedValue([]);

				return { data };
			};

			it('should throw error', async () => {
				const { data } = setup();

				await expect(sut.apply(data)).rejects.toThrow();
			});
		});
	});
});
