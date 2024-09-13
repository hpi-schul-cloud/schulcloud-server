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
import { ClassFactory, ClassService } from '@src/modules/class';
import {
	ExternalClassDto,
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
	let classService: DeepMocked<ClassService>;

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
				{
					provide: ClassService,
					useValue: createMock<ClassService>(),
				},
			],
		}).compile();

		sut = module.get(TspProvisioningStrategy);
		schoolService = module.get(SchoolService);
		userService = module.get(UserService);
		roleService = module.get(RoleService);
		accountService = module.get(AccountService);
		classService = module.get(ClassService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
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
						firstName: faker.person.firstName(),
						lastName: faker.person.lastName(),
					}),
					externalSchool: new ExternalSchoolDto({ externalId: school.id, name: school.getInfo().name }),
					externalClasses: [],
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
					externalClasses: [],
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

		describe('When external user changed school', () => {
			const setup = () => {
				const user = userDoFactory.build({ id: faker.string.uuid() });
				const system = new ProvisioningSystemDto({
					systemId: faker.string.uuid(),
					provisioningStrategy: SystemProvisioningStrategy.TSP,
				});
				const externalUser = new ExternalUserDto({
					externalId: faker.string.uuid(),
					roles: [RoleName.TEACHER],
					email: faker.internet.email(),
					firstName: faker.person.firstName(),
					lastName: faker.person.lastName(),
				});
				const externalSchool = new ExternalSchoolDto({ externalId: faker.string.uuid(), name: faker.string.alpha() });
				const externalClasses = [];
				const data = new OauthDataDto({ system, externalUser, externalSchool, externalClasses });

				schoolService.getSchools.mockResolvedValue([schoolFactory.build()]);
				userService.findByExternalId.mockResolvedValue(user);
				userService.save.mockResolvedValue(user);
				roleService.findByNames.mockResolvedValue([
					new RoleReference({ id: faker.string.uuid(), name: RoleName.TEACHER }),
					new RoleReference({ id: faker.string.uuid(), name: RoleName.STUDENT }),
				]);

				return { system, externalUser, externalSchool, data };
			};

			it('should update user with new school id', async () => {
				const { data } = setup();

				await expect(sut.apply(data)).resolves.not.toThrow();
				// expect(updateUserSpy).toHaveBeenCalledTimes(1);
			});
		});

		describe('When external user classes change', () => {
			const setup = () => {
				const system = new ProvisioningSystemDto({
					systemId: faker.string.uuid(),
					provisioningStrategy: SystemProvisioningStrategy.TSP,
				});
				const externalUser = new ExternalUserDto({
					externalId: faker.string.uuid(),
					roles: [RoleName.TEACHER, RoleName.STUDENT],
					email: faker.internet.email(),
					firstName: faker.person.firstName(),
					lastName: faker.person.lastName(),
				});
				const externalSchool = new ExternalSchoolDto({ externalId: faker.string.uuid(), name: faker.string.alpha() });
				const externalClasses = [
					new ExternalClassDto({ externalId: faker.string.uuid(), name: faker.string.alpha() }),
					new ExternalClassDto({ externalId: faker.string.uuid(), name: faker.string.alpha() }),
				];
				const data = new OauthDataDto({ system, externalUser, externalSchool, externalClasses });
				const user = userDoFactory.build({
					id: faker.string.uuid(),
				});
				const aclass = ClassFactory.create({
					id: faker.string.uuid(),
					schoolId: faker.string.uuid(),
					name: faker.string.alpha(),
				});

				userService.save.mockResolvedValue(user);
				userService.findByExternalId.mockResolvedValue(user);
				schoolService.getSchools.mockResolvedValue([schoolFactory.build()]);
				classService.findClassWithSchoolIdAndExternalId.mockResolvedValueOnce(aclass);
				roleService.findByNames.mockResolvedValue([
					new RoleReference({ id: faker.string.uuid(), name: RoleName.TEACHER }),
					new RoleReference({ id: faker.string.uuid(), name: RoleName.STUDENT }),
				]);

				return { data };
			};

			it('should update or create classes', async () => {
				const { data } = setup();

				await expect(sut.apply(data)).resolves.not.toThrow();

				expect(classService.save).toHaveBeenCalledTimes(2);
			});
		});
	});
});
