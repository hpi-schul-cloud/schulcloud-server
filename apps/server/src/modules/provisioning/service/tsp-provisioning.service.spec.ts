import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { TspUserInfo } from '@infra/sync';
import { AccountService } from '@modules/account';
import { accountDoFactory } from '@modules/account/testing';
import { ClassService, ClassSourceOptions } from '@modules/class';
import { classFactory } from '@modules/class/domain/testing';
import { RoleName, RoleService } from '@modules/role';
import { roleDtoFactory, roleFactory } from '@modules/role/testing';
import { SchoolService } from '@modules/school';
import { schoolFactory } from '@modules/school/testing';
import { ParentConsent, UserConsent, UserService } from '@modules/user';
import { userDoFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { BadDataLoggableException } from '../loggable';
import {
	externalClassDtoFactory,
	externalSchoolDtoFactory,
	externalUserDtoFactory,
	oauthDataDtoFactory,
	provisioningSystemDtoFactory,
} from '../testing';
import { TspProvisioningService } from './tsp-provisioning.service';
import { Logger } from '@core/logger';

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
				{
					provide: Logger,
					useValue: createMock<Logger>(),
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

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('provisionUserBatch', () => {
		describe('when batch is provisioned', () => {
			const setup = () => {
				const system = provisioningSystemDtoFactory.build();
				const externalUser = externalUserDtoFactory.build();
				const externalSchool = externalSchoolDtoFactory.build();

				const oauthDataDto = oauthDataDtoFactory.build({
					system,
					externalUser,
					externalSchool,
				});
				const oauthDataDtos = [oauthDataDto];

				const school = schoolFactory.build({
					externalId: externalSchool.externalId,
				});
				const schools = new Map([[externalSchool.externalId, school]]);

				userServiceMock.findByExternalId.mockResolvedValueOnce(userDoFactory.build());
				roleServiceMock.findByNames.mockResolvedValueOnce(roleDtoFactory.buildList(1));
				userServiceMock.saveAll
					.mockResolvedValueOnce(userDoFactory.buildListWithId(1))
					.mockResolvedValueOnce(userDoFactory.buildListWithId(1));
				accountServiceMock.findByUserId.mockResolvedValueOnce(accountDoFactory.build());
				accountServiceMock.saveAll.mockResolvedValueOnce(accountDoFactory.buildList(1));

				return { oauthDataDtos, schools };
			};

			it('should return number of provisioned users and call services with available data', async () => {
				const { oauthDataDtos, schools } = setup();

				const result = await sut.provisionUserBatch(oauthDataDtos, schools);

				expect(result).toBe(1);
				expect(userServiceMock.findByExternalId).toHaveBeenCalledTimes(1);
				expect(roleServiceMock.findByNames).toHaveBeenCalledTimes(1);
				expect(userServiceMock.saveAll).toHaveBeenCalledTimes(2);
				expect(accountServiceMock.findByUserId).toHaveBeenCalledTimes(1);
				expect(accountServiceMock.saveAll).toHaveBeenCalledTimes(1);
				expect(classServiceMock.findClassWithSchoolIdAndExternalId).toHaveBeenCalledTimes(0);
			});
		});

		describe('when school is not found for an external id', () => {
			const setup = () => {
				const system = provisioningSystemDtoFactory.build();
				const externalUser = externalUserDtoFactory.build();
				const oauthDataDto = oauthDataDtoFactory.build({
					system,
					externalUser,
				});
				const oauthDataDtos = [oauthDataDto];

				roleServiceMock.findByNames.mockResolvedValueOnce(roleDtoFactory.buildList(1));

				return { oauthDataDtos };
			};

			it('should throw NotFoundLoggableException', async () => {
				const { oauthDataDtos } = setup();

				await expect(sut.provisionUserBatch(oauthDataDtos, new Map())).rejects.toThrow(NotFoundLoggableException);
			});
		});
	});

	describe('provisionClassBatch', () => {
		describe('when class does not exist', () => {
			const setup = (withName = true) => {
				const school = schoolFactory.build();

				const externalTeacher = externalUserDtoFactory.build();
				const externalStudent = externalUserDtoFactory.build();

				const classId = faker.string.uuid();
				const externalClass = externalClassDtoFactory.build({
					externalId: classId,
					name: withName ? faker.person.fullName() : '',
				});

				const usersOfClasses = new Map([
					[
						classId,
						[
							{
								externalId: externalTeacher.externalId,
								role: RoleName.TEACHER,
							} as TspUserInfo,
							{
								externalId: externalStudent.externalId,
								role: RoleName.STUDENT,
							} as TspUserInfo,
						],
					],
				]);

				classServiceMock.findClassesForSchool.mockResolvedValueOnce([]);
				userServiceMock.findMultipleByExternalIds
					.mockResolvedValueOnce([faker.string.uuid()])
					.mockResolvedValueOnce([faker.string.uuid()]);

				return { school, externalClasses: [externalClass], usersOfClasses };
			};

			it('should create class', async () => {
				const { school, externalClasses, usersOfClasses } = setup();

				const result = await sut.provisionClassBatch(school, externalClasses, usersOfClasses, false);
				expect(result.classCreationCount).toBe(1);
				expect(result.classUpdateCount).toBe(0);
				expect(classServiceMock.save).toHaveBeenCalledTimes(1);
			});

			it('should not create class without name', async () => {
				const { school, externalClasses, usersOfClasses } = setup(false);
				await sut.provisionClassBatch(school, externalClasses, usersOfClasses, false);
				expect(classServiceMock.save).toHaveBeenCalledTimes(0);
			});
		});

		describe('when class already exist', () => {
			const setup = (withName = true) => {
				const school = schoolFactory.build();

				const externalTeacher = externalUserDtoFactory.build();
				const externalStudent = externalUserDtoFactory.build();

				const classId = faker.string.uuid();
				const externalClass = externalClassDtoFactory.build({
					externalId: classId,
					name: withName ? faker.person.fullName() : '',
				});

				const usersOfClasses = new Map([
					[
						classId,
						[
							{
								externalId: externalTeacher.externalId,
								role: RoleName.TEACHER,
							} as TspUserInfo,
							{
								externalId: externalStudent.externalId,
								role: RoleName.STUDENT,
							} as TspUserInfo,
						],
					],
				]);

				classServiceMock.findClassesForSchool.mockResolvedValueOnce(
					classFactory.buildList(1, {
						sourceOptions: new ClassSourceOptions({
							tspUid: classId,
						}),
					})
				);
				userServiceMock.findMultipleByExternalIds
					.mockResolvedValueOnce([faker.string.uuid()])
					.mockResolvedValueOnce([faker.string.uuid()]);

				return { school, externalClasses: [externalClass], usersOfClasses };
			};

			it('should update class', async () => {
				const { school, externalClasses, usersOfClasses } = setup();

				const result = await sut.provisionClassBatch(school, externalClasses, usersOfClasses, false);
				expect(result.classCreationCount).toBe(0);
				expect(result.classUpdateCount).toBe(1);
				expect(classServiceMock.save).toHaveBeenCalledTimes(1);
			});

			it('should not create class without name', async () => {
				const { school, externalClasses, usersOfClasses } = setup(false);
				await sut.provisionClassBatch(school, externalClasses, usersOfClasses, false);
				expect(classServiceMock.save).toHaveBeenCalledTimes(0);
			});
		});

		describe('when the batch is for a full sync', () => {
			const setup = () => {
				const school = schoolFactory.build();

				const externalTeacher = externalUserDtoFactory.build();
				const externalStudent = externalUserDtoFactory.build();

				const classId = faker.string.uuid();
				const externalClass = externalClassDtoFactory.build({
					externalId: classId,
				});

				const usersOfClasses = new Map([
					[
						classId,
						[
							{
								externalId: externalTeacher.externalId,
								role: RoleName.TEACHER,
							} as TspUserInfo,
							{
								externalId: externalStudent.externalId,
								role: RoleName.STUDENT,
							} as TspUserInfo,
						],
					],
				]);

				classServiceMock.findClassesForSchool.mockResolvedValueOnce(
					classFactory.buildList(1, {
						sourceOptions: new ClassSourceOptions({
							tspUid: classId,
						}),
						userIds: [faker.string.uuid(), faker.string.uuid(), faker.string.uuid()],
						teacherIds: [faker.string.uuid()],
					})
				);

				const newUserId = faker.string.uuid();
				const newTeacherId = faker.string.uuid();

				const externalUserMappings = new Map([
					[externalStudent.externalId, newUserId],
					[externalTeacher.externalId, newTeacherId],
				]);

				userServiceMock.findMultipleByExternalIds.mockImplementation((externalIds) =>
					Promise.resolve(
						externalIds.map((externalId) => externalUserMappings.get(externalId)).filter((id) => id !== undefined)
					)
				);

				return { school, externalClasses: [externalClass], usersOfClasses, newUserId, newTeacherId };
			};

			it('should clear the participants of the classes and set new ones', async () => {
				const { school, externalClasses, usersOfClasses, newUserId, newTeacherId } = setup();

				const result = await sut.provisionClassBatch(school, externalClasses, usersOfClasses, true);
				expect(result.classCreationCount).toBe(0);
				expect(result.classUpdateCount).toBe(1);
				expect(classServiceMock.save).toHaveBeenCalledTimes(1);
				expect(classServiceMock.save).toHaveBeenCalledWith([
					expect.objectContaining({
						userIds: [newUserId],
						teacherIds: [newTeacherId],
					}),
				]);
			});
		});
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
				const classes = [externalClassDtoFactory.build()];
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

				classServiceMock.findClassWithSchoolIdAndExternalId.mockResolvedValueOnce(clazz);

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

				classServiceMock.findClassWithSchoolIdAndExternalId.mockResolvedValueOnce(null);

				return { school, classes, user };
			};

			it('should create class', async () => {
				const { school, classes, user } = setup();

				await sut.provisionClasses(school, classes, user);

				expect(classServiceMock.save).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('when class has no name', () => {
		const setup = () => {
			const school = schoolFactory.build();
			const classes = [externalClassDtoFactory.build({ name: '' })];
			const user = userDoFactory.buildWithId({
				roles: [roleFactory.build({ name: RoleName.TEACHER }), roleFactory.build({ name: RoleName.STUDENT })],
			});

			classServiceMock.findClassWithSchoolIdAndExternalId.mockResolvedValueOnce(null);

			return { school, classes, user };
		};

		it('should not create class', async () => {
			const { school, classes, user } = setup();

			await sut.provisionClasses(school, classes, user);

			expect(classServiceMock.save).toHaveBeenCalledTimes(0);
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
				roleServiceMock.findByNames.mockResolvedValueOnce(roleDtoFactory.buildList(1));

				return { data, school };
			};

			it('should update user', async () => {
				const { data, school } = setup();

				await sut.provisionUser(data, school);

				expect(userServiceMock.save).toHaveBeenCalledTimes(2);
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

				userServiceMock.findByExternalId.mockResolvedValueOnce(user);
				userServiceMock.save.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
				schoolServiceMock.getSchools.mockResolvedValueOnce([school]);
				roleServiceMock.findByNames.mockResolvedValueOnce(roles);

				return { data, school };
			};

			it('should update user and change school', async () => {
				const { data, school } = setup();

				await sut.provisionUser(data, school);

				expect(userServiceMock.save).toHaveBeenCalledTimes(2);
				expect(accountServiceMock.save).toHaveBeenCalledTimes(1);
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

				userServiceMock.findByExternalId.mockResolvedValueOnce(null);
				schoolServiceMock.getSchools.mockResolvedValueOnce([school]);
				roleServiceMock.findByNames.mockResolvedValueOnce([]);

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

				userServiceMock.findByExternalId.mockResolvedValueOnce(null);
				userServiceMock.save.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
				schoolServiceMock.getSchools.mockResolvedValueOnce([school]);
				roleServiceMock.findByNames.mockResolvedValueOnce([]);

				return { data, school };
			};

			it('should create user', async () => {
				const { data, school } = setup();

				await sut.provisionUser(data, school);

				expect(userServiceMock.save).toHaveBeenCalledTimes(2);
				expect(accountServiceMock.save).toHaveBeenCalledTimes(1);
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

				userServiceMock.findByExternalId.mockResolvedValueOnce(null);
				userServiceMock.save.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
				schoolServiceMock.getSchools.mockResolvedValueOnce([school]);
				roleServiceMock.findByNames.mockResolvedValueOnce([]);

				return { data, school };
			};

			it('should throw BadDataLoggableException', async () => {
				const { data, school } = setup();

				await expect(() => sut.provisionUser(data, school)).rejects.toThrow(BadDataLoggableException);
			});
		});

		describe('when an error occurs while saving account', () => {
			const setup = () => {
				const school = schoolFactory.build();
				const data = oauthDataDtoFactory.build({
					system: provisioningSystemDtoFactory.build(),
					externalUser: externalUserDtoFactory.build(),
					externalSchool: externalSchoolDtoFactory.build(),
				});
				const user = userDoFactory.build({ id: faker.string.uuid(), roles: [] });

				userServiceMock.findByExternalId.mockResolvedValueOnce(null);
				userServiceMock.save.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
				schoolServiceMock.getSchools.mockResolvedValueOnce([school]);
				roleServiceMock.findByNames.mockResolvedValueOnce([]);

				accountServiceMock.findByUserId.mockRejectedValueOnce(new Error('Test error'));

				return { data, school, user };
			};

			it('should delete the user and throw BadDataLoggableException', async () => {
				const { data, school, user } = setup();

				await expect(sut.provisionUser(data, school)).rejects.toThrow(BadDataLoggableException);
				expect(userServiceMock.deleteUser).toHaveBeenCalledWith(user.id);
			});
		});

		describe('when user has incomplete consent', () => {
			const setup = (parentConsents: ParentConsent[] | undefined, userConsent: UserConsent | undefined) => {
				const school = schoolFactory.build();
				const data = oauthDataDtoFactory.build({
					system: provisioningSystemDtoFactory.build(),
					externalUser: externalUserDtoFactory.build(),
					externalSchool: externalSchoolDtoFactory.build(),
				});
				const user = userDoFactory.build({
					id: faker.string.uuid(),
					consent: {
						parentConsents,
						userConsent,
					},
				});

				userServiceMock.findByExternalId.mockResolvedValueOnce(user);
				userServiceMock.save.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
				schoolServiceMock.getSchools.mockResolvedValueOnce([school]);
				roleServiceMock.findByNames.mockResolvedValueOnce([]);

				return { data, school };
			};

			it('should create consent if parent consent is empty and user consent is undefined', async () => {
				const { data, school } = setup([], undefined);

				await sut.provisionUser(data, school);

				expect(userServiceMock.save).toHaveBeenCalledTimes(2);

				expect(userServiceMock.save.mock.calls[0][0].consent?.parentConsents?.[0]).toMatchObject({
					form: 'digital',
					privacyConsent: true,
					termsOfUseConsent: true,
					dateOfPrivacyConsent: expect.any(Date),
					dateOfTermsOfUseConsent: expect.any(Date),
				});

				expect(userServiceMock.save.mock.calls[0][0].consent?.userConsent).toMatchObject({
					form: 'digital',
					privacyConsent: true,
					termsOfUseConsent: true,
					dateOfPrivacyConsent: expect.any(Date),
					dateOfTermsOfUseConsent: expect.any(Date),
				});
			});

			it('should create consent if user consent exists but parent consent is missing', async () => {
				const { data, school } = setup(undefined, {
					form: 'digital',
					privacyConsent: true,
					termsOfUseConsent: true,
					dateOfPrivacyConsent: new Date(),
					dateOfTermsOfUseConsent: new Date(),
				});

				await sut.provisionUser(data, school);

				expect(userServiceMock.save).toHaveBeenCalledTimes(2);

				expect(userServiceMock.save.mock.calls[0][0].consent?.parentConsents?.[0]).toMatchObject({
					form: 'digital',
					privacyConsent: true,
					termsOfUseConsent: true,
					dateOfPrivacyConsent: expect.any(Date),
					dateOfTermsOfUseConsent: expect.any(Date),
				});
			});

			it('should create consent if parent consent exists but user consent is missing', async () => {
				const { data, school } = setup(
					[
						{
							id: faker.string.uuid(),
							form: 'digital',
							privacyConsent: true,
							termsOfUseConsent: true,
							dateOfPrivacyConsent: new Date(),
							dateOfTermsOfUseConsent: new Date(),
						},
					],
					undefined
				);

				await sut.provisionUser(data, school);

				expect(userServiceMock.save).toHaveBeenCalledTimes(2);

				expect(userServiceMock.save.mock.calls[0][0].consent?.userConsent).toMatchObject({
					form: 'digital',
					privacyConsent: true,
					termsOfUseConsent: true,
					dateOfPrivacyConsent: expect.any(Date),
					dateOfTermsOfUseConsent: expect.any(Date),
				});
			});

			it('should not create a new consent if both parent consent and user consent exist', async () => {
				const currentDate = new Date();
				const { data, school } = setup(
					[
						{
							id: faker.string.uuid(),
							form: 'digital',
							privacyConsent: true,
							termsOfUseConsent: true,
							dateOfPrivacyConsent: currentDate,
							dateOfTermsOfUseConsent: currentDate,
						},
					],
					{
						form: 'digital',
						privacyConsent: true,
						termsOfUseConsent: true,
						dateOfPrivacyConsent: currentDate,
						dateOfTermsOfUseConsent: currentDate,
					}
				);

				await sut.provisionUser(data, school);

				expect(userServiceMock.save).toHaveBeenCalledTimes(2);

				expect(userServiceMock.save.mock.calls[0][0].consent?.parentConsents?.[0]).toMatchObject({
					id: expect.any(String),
					form: 'digital',
					privacyConsent: true,
					termsOfUseConsent: true,
					dateOfPrivacyConsent: currentDate,
					dateOfTermsOfUseConsent: currentDate,
				});

				expect(userServiceMock.save.mock.calls[0][0].consent?.userConsent).toMatchObject({
					form: 'digital',
					privacyConsent: true,
					termsOfUseConsent: true,
					dateOfPrivacyConsent: currentDate,
					dateOfTermsOfUseConsent: currentDate,
				});
			});
		});
	});
});
