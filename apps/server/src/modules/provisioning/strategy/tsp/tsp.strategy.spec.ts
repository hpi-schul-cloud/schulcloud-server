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
import jwt from 'jsonwebtoken';
import {
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	OauthDataStrategyInputDto,
	ProvisioningSystemDto,
} from '../..';
import { TspProvisioningStrategy } from './tsp.strategy';

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
			const setup = async () => {
				const input: OauthDataStrategyInputDto = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: 'externalSchoolId',
						provisioningStrategy: SystemProvisioningStrategy.TSP,
					}),
					idToken: 'tspIdToken',
					accessToken: 'tspAccessToken',
				});

				jest.spyOn(jwt, 'decode').mockImplementation(() => {
					return {
						sub: 'externalUserId',
						sid: 'externalSchoolId',
						ptscListRolle: 'teacher',
						personVorname: 'firstName',
						personNachname: 'lastName',
						ptscSchuleNummer: 'externalSchoolId',
					};
				});

				const user: ExternalUserDto = new ExternalUserDto({
					externalId: 'externalUserId',
					roles: [RoleName.TEACHER],
					firstName: 'firstName',
					lastName: 'lastName',
				});

				const externalSchool = await schoolService.getSchoolById(input.system.systemId);
				const schoolName = externalSchool.getProps().name;
				const school: ExternalSchoolDto = new ExternalSchoolDto({
					externalId: 'externalSchoolId',
					name: schoolName,
				});

				return { input, user, school };
			};

			it('should return mapped oauthDataDto if input is valid', async () => {
				const { input, user, school } = await setup();
				const result = await sut.getData(input);

				expect(result).toEqual({
					system: input.system,
					externalUser: user,
					externalSchool: school,
					externalGroups: undefined,
					externalLicenses: undefined,
				} as OauthDataDto);
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
						firstName: faker.person.firstName(),
						lastName: faker.person.lastName(),
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
				const user = userDoFactory.build({
					id: faker.string.uuid(),
				});
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
						firstName: faker.person.firstName(),
						lastName: faker.person.lastName(),
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

		describe('When external user does not have a firstName', () => {
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
						firstName: undefined,
					}),
					externalSchool: new ExternalSchoolDto({ externalId: school.id, name: school.getInfo().name }),
				});

				schoolService.getSchools.mockResolvedValue([school]);
				roleService.findByNames.mockResolvedValue([]);
				userService.findByExternalId.mockResolvedValue(null);

				return { data };
			};

			it('should throw', async () => {
				const { data } = setup();

				await expect(sut.apply(data)).rejects.toThrow();
			});
		});

		describe('When external user does not have a lastname', () => {
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
						lastName: undefined,
					}),
					externalSchool: new ExternalSchoolDto({ externalId: school.id, name: school.getInfo().name }),
				});

				schoolService.getSchools.mockResolvedValue([school]);
				roleService.findByNames.mockResolvedValue([]);
				userService.findByExternalId.mockResolvedValue(null);

				return { data };
			};

			it('should throw', async () => {
				const { data } = setup();

				await expect(sut.apply(data)).rejects.toThrow();
			});
		});

		describe('When external user does not have an email', () => {
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
						email: undefined,
					}),
					externalSchool: new ExternalSchoolDto({ externalId: school.id, name: school.getInfo().name }),
				});

				schoolService.getSchools.mockResolvedValue([school]);
				roleService.findByNames.mockResolvedValue([]);
				userService.findByExternalId.mockResolvedValue(null);

				return { data };
			};

			it('should throw', async () => {
				const { data } = setup();

				await expect(sut.apply(data)).rejects.toThrow();
			});
		});

		describe('When user does not have an id after creation', () => {
			const setup = () => {
				const school = schoolFactory.build();
				const user = userDoFactory.build({
					id: undefined,
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
						firstName: faker.person.firstName(),
						lastName: faker.person.lastName(),
					}),
					externalSchool: new ExternalSchoolDto({ externalId: school.id, name: school.getInfo().name }),
				});

				schoolService.getSchools.mockResolvedValue([school]);
				roleService.findByNames.mockResolvedValue([]);
				userService.findByExternalId.mockResolvedValue(user);
				userService.save.mockResolvedValue(user);

				return { data };
			};

			it('should throw', async () => {
				const { data } = setup();

				await expect(sut.apply(data)).rejects.toThrow();
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
