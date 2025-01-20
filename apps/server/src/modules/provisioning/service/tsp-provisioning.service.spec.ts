import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { RoleName } from '@shared/domain/interface';
import { AccountService } from '@modules/account';
import { ClassService } from '@modules/class';
import { classFactory } from '@modules/class/domain/testing';
import { RoleService } from '@modules/role';
import { SchoolService } from '@modules/school';
import { schoolFactory } from '@modules/school/testing';
import { UserService } from '@modules/user';
import { roleDtoFactory } from '@testing/factory/role-dto.factory';
import { roleFactory } from '@testing/factory/role.factory';
import { userDoFactory } from '@testing/factory/user.do.factory';
import { BadDataLoggableException } from '../loggable';
import {
	externalClassDtoFactory,
	externalSchoolDtoFactory,
	externalUserDtoFactory,
	oauthDataDtoFactory,
	provisioningSystemDtoFactory,
} from '../testing';
import { TspProvisioningService } from './tsp-provisioning.service';

describe('TspProvisioningService', () => {
	let module: TestingModule;
	let sut: TspProvisioningService;
	let schoolServiceMock: DeepMocked<SchoolService>;
	let classServiceMock: DeepMocked<ClassService>;
	let roleServiceMock: DeepMocked<RoleService>;
	let userServiceMock: DeepMocked<UserService>;
	let accountServiceMock: DeepMocked<AccountService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TspProvisioningService,
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: ClassService,
					useValue: createMock<ClassService>(),
				},
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
			],
		}).compile();

		sut = module.get(TspProvisioningService);
		schoolServiceMock = module.get(SchoolService);
		classServiceMock = module.get(ClassService);
		roleServiceMock = module.get(RoleService);
		userServiceMock = module.get(UserService);
		accountServiceMock = module.get(AccountService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
		jest.restoreAllMocks();
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('findSchoolOrFail', () => {
		describe('when school is found', () => {
			const setup = () => {
				const system = provisioningSystemDtoFactory.build();
				const externalSchool = externalSchoolDtoFactory.build();
				const school = schoolFactory.build();

				schoolServiceMock.getSchools.mockResolvedValueOnce([school]);

				return { system, externalSchool, school };
			};

			it('should return school', async () => {
				const { system, externalSchool, school } = setup();

				const result = await sut.findSchoolOrFail(system, externalSchool);

				expect(result).toEqual(school);
			});
		});

		describe('when school is not found', () => {
			const setup = () => {
				const system = provisioningSystemDtoFactory.build();
				const externalSchool = externalSchoolDtoFactory.build();

				schoolServiceMock.getSchools.mockResolvedValueOnce([]);

				return { system, externalSchool };
			};

			it('should throw', async () => {
				const { system, externalSchool } = setup();

				await expect(sut.findSchoolOrFail(system, externalSchool)).rejects.toThrow(NotFoundLoggableException);
			});
		});
	});

	describe('provisionClasses', () => {
		describe('when user ID is missing and class exists', () => {
			const setup = () => {
				const school = schoolFactory.build();
				const classes = [externalClassDtoFactory.build()];
				const user = userDoFactory.build();

				return { school, classes, user };
			};

			it('should throw', async () => {
				const { school, classes, user } = setup();

				await expect(sut.provisionClasses(school, classes, user)).rejects.toThrow(BadDataLoggableException);
			});
		});

		describe('when user ID is missing and class does not exist', () => {
			const setup = () => {
				const school = schoolFactory.build();
				const classes = [setupExternalClass()];
				const user = userDoFactory.build();

				classServiceMock.findClassWithSchoolIdAndExternalId.mockResolvedValueOnce(null);

				return { school, classes, user };
			};

			it('should throw', async () => {
				const { school, classes, user } = setup();

				await expect(sut.provisionClasses(school, classes, user)).rejects.toThrow(BadDataLoggableException);
			});
		});

		describe('when class exists', () => {
			const setup = () => {
				const school = schoolFactory.build();
				const classes = [externalClassDtoFactory.build()];
				const clazz = classFactory.build();
				const user = userDoFactory.buildWithId({
					roles: [roleFactory.build({ name: RoleName.TEACHER }), roleFactory.build({ name: RoleName.STUDENT })],
				});

				classServiceMock.findClassWithSchoolIdAndExternalId.mockResolvedValue(clazz);

				return { school, classes, user };
			};

			it('should update class', async () => {
				const { school, classes, user } = setup();

				await sut.provisionClasses(school, classes, user);

				expect(classServiceMock.save).toHaveBeenCalledTimes(1);
			});
		});

		describe('when class does not exist', () => {
			const setup = () => {
				const school = schoolFactory.build();
				const classes = [externalClassDtoFactory.build()];
				const user = userDoFactory.buildWithId({
					roles: [roleFactory.build({ name: RoleName.TEACHER }), roleFactory.build({ name: RoleName.STUDENT })],
				});

				classServiceMock.findClassWithSchoolIdAndExternalId.mockResolvedValue(null);

				return { school, classes, user };
			};

			it('should create class', async () => {
				const { school, classes, user } = setup();

				await sut.provisionClasses(school, classes, user);

				expect(classServiceMock.save).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('provisionUser', () => {
		describe('when external school is missing', () => {
			const setup = () => {
				const data = oauthDataDtoFactory.build({
					system: provisioningSystemDtoFactory.build(),
					externalSchool: undefined,
				});
				const school = schoolFactory.build();

				return { data, school };
			};

			it('should throw', async () => {
				const { data, school } = setup();

				await expect(sut.provisionUser(data, school)).rejects.toThrow(BadDataLoggableException);
			});
		});

		describe('when user exists and school is the same', () => {
			const setup = () => {
				const school = schoolFactory.build();
				const data = oauthDataDtoFactory.build({
					system: provisioningSystemDtoFactory.build(),
					externalUser: externalUserDtoFactory.build(),
					externalSchool: externalSchoolDtoFactory.build({
						externalId: school.externalId,
					}),
				});
				const user = userDoFactory.build({ id: faker.string.uuid() });

				userServiceMock.findByExternalId.mockResolvedValue(user);
				userServiceMock.save.mockResolvedValue(user);
				schoolServiceMock.getSchools.mockResolvedValue([school]);

				return { data, school };
			};

			it('should update user', async () => {
				const { data, school } = setup();

				await sut.provisionUser(data, school);

				expect(userServiceMock.save).toHaveBeenCalledTimes(1);
				expect(accountServiceMock.save).toHaveBeenCalledTimes(1);
			});
		});

		describe('when user exists and school is different', () => {
			const setup = () => {
				const school = schoolFactory.build();
				const data = oauthDataDtoFactory.build({
					system: provisioningSystemDtoFactory.build(),
					externalUser: externalUserDtoFactory.build(),
					externalSchool: externalSchoolDtoFactory.build(),
				});
				const user = userDoFactory.build({ id: faker.string.uuid() });
				const roles = [
					roleDtoFactory.build({ name: RoleName.TEACHER }),
					roleDtoFactory.build({ name: RoleName.STUDENT }),
				];

				userServiceMock.findByExternalId.mockResolvedValue(user);
				userServiceMock.save.mockResolvedValue(user);
				schoolServiceMock.getSchools.mockResolvedValue([school]);
				roleServiceMock.findByNames.mockResolvedValue(roles);

				return { data, school };
			};

			it('should update user and change school', async () => {
				const { data, school } = setup();

				await sut.provisionUser(data, school);

				expect(userServiceMock.save).toHaveBeenCalledTimes(1);
				expect(accountServiceMock.saveWithValidation).toHaveBeenCalledTimes(1);
			});
		});

		describe('when user does not exist and has no firstname, lastname and email', () => {
			const setup = (withFirstname: boolean, withLastname: boolean, withEmail: boolean) => {
				const school = schoolFactory.build();
				const data = oauthDataDtoFactory.build({
					system: provisioningSystemDtoFactory.build(),
					externalUser: externalUserDtoFactory.build({
						firstName: withFirstname ? faker.person.firstName() : undefined,
						lastName: withLastname ? faker.person.lastName() : undefined,
						email: withEmail ? faker.internet.email() : undefined,
					}),
					externalSchool: externalSchoolDtoFactory.build(),
				});

				userServiceMock.findByExternalId.mockResolvedValue(null);
				schoolServiceMock.getSchools.mockResolvedValue([school]);
				roleServiceMock.findByNames.mockResolvedValue([]);

				return { data, school };
			};

			it('should throw with no firstname', async () => {
				const { data, school } = setup(false, true, true);

				await expect(sut.provisionUser(data, school)).rejects.toThrow(BadDataLoggableException);
			});

			it('should throw with no lastname', async () => {
				const { data, school } = setup(true, false, true);

				await expect(sut.provisionUser(data, school)).rejects.toThrow(BadDataLoggableException);
			});
		});

		describe('when user does not exist', () => {
			const setup = () => {
				const school = schoolFactory.build();
				const data = oauthDataDtoFactory.build({
					system: provisioningSystemDtoFactory.build(),
					externalUser: externalUserDtoFactory.build({
						firstName: faker.person.firstName(),
						lastName: faker.person.lastName(),
						email: faker.internet.email(),
					}),
					externalSchool: externalSchoolDtoFactory.build(),
				});
				const user = userDoFactory.build({ id: faker.string.uuid(), roles: [] });

				userServiceMock.findByExternalId.mockResolvedValue(null);
				userServiceMock.save.mockResolvedValue(user);
				schoolServiceMock.getSchools.mockResolvedValue([school]);
				roleServiceMock.findByNames.mockResolvedValue([]);

				return { data, school };
			};

			it('should create user', async () => {
				const { data, school } = setup();

				await sut.provisionUser(data, school);

				expect(userServiceMock.save).toHaveBeenCalledTimes(1);
				expect(accountServiceMock.saveWithValidation).toHaveBeenCalledTimes(1);
			});
		});

		describe('when user id is not set after create', () => {
			const setup = () => {
				const school = schoolFactory.build();
				const data = oauthDataDtoFactory.build({
					system: provisioningSystemDtoFactory.build(),
					externalUser: externalUserDtoFactory.build({
						firstName: faker.person.firstName(),
						lastName: faker.person.lastName(),
						email: faker.internet.email(),
					}),
					externalSchool: externalSchoolDtoFactory.build(),
				});
				const user = userDoFactory.build({ id: undefined, roles: [] });

				userServiceMock.findByExternalId.mockResolvedValue(null);
				userServiceMock.save.mockResolvedValue(user);
				schoolServiceMock.getSchools.mockResolvedValue([school]);
				roleServiceMock.findByNames.mockResolvedValue([]);

				return { data, school };
			};

			it('should throw BadDataLoggableException', async () => {
				const { data, school } = setup();

				await expect(() => sut.provisionUser(data, school)).rejects.toThrow(BadDataLoggableException);
			});
		});
	});
});
