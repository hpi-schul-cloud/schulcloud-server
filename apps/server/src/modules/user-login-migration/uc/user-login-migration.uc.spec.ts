import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthenticationService } from '@modules/authentication';
import { Action, AuthorizationService } from '@modules/authorization';
import { LegacySchoolService } from '@modules/legacy-school';
import { OAuthService, OAuthTokenDto } from '@modules/oauth';
import {
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	ProvisioningService,
	ProvisioningSystemDto,
} from '@modules/provisioning';
import { SystemEntity } from '@modules/system/entity';
import { UserService } from '@modules/user';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { LegacySchoolDo, Page, RoleReference, UserLoginMigrationDO } from '@shared/domain/domainobject';
import { Role, User } from '@shared/domain/entity';
import { Permission, RoleName } from '@shared/domain/interface';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import {
	legacySchoolDoFactory,
	schoolEntityFactory,
	setupEntities,
	systemEntityFactory,
	userDoFactory,
	userFactory,
	userLoginMigrationDOFactory,
} from '@shared/testing';
import { Logger } from '@src/core/logger';
import {
	ExternalSchoolNumberMissingLoggableException,
	InvalidUserLoginMigrationLoggableException,
	UserLoginMigrationAlreadyClosedLoggableException,
	UserLoginMigrationInvalidAdminLoggableException,
	UserLoginMigrationMultipleEmailUsersLoggableException,
	UserLoginMigrationSchoolAlreadyMigratedLoggableException,
} from '../loggable';
import { SchoolMigrationService, UserLoginMigrationService, UserMigrationService } from '../service';
import { UserLoginMigrationUc } from './user-login-migration.uc';

describe(UserLoginMigrationUc.name, () => {
	let module: TestingModule;
	let uc: UserLoginMigrationUc;

	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;
	let oAuthService: DeepMocked<OAuthService>;
	let provisioningService: DeepMocked<ProvisioningService>;
	let schoolMigrationService: DeepMocked<SchoolMigrationService>;
	let userMigrationService: DeepMocked<UserMigrationService>;
	let authenticationService: DeepMocked<AuthenticationService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolService: DeepMocked<LegacySchoolService>;
	let userService: DeepMocked<UserService>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				UserLoginMigrationUc,
				{
					provide: UserMigrationService,
					useValue: createMock<UserMigrationService>(),
				},
				{
					provide: UserLoginMigrationService,
					useValue: createMock<UserLoginMigrationService>(),
				},
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
					provide: AuthenticationService,
					useValue: createMock<AuthenticationService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		uc = module.get(UserLoginMigrationUc);
		userMigrationService = module.get(UserMigrationService);
		userLoginMigrationService = module.get(UserLoginMigrationService);
		oAuthService = module.get(OAuthService);
		provisioningService = module.get(ProvisioningService);
		schoolMigrationService = module.get(SchoolMigrationService);
		userMigrationService = module.get(UserMigrationService);
		authenticationService = module.get(AuthenticationService);
		authorizationService = module.get(AuthorizationService);
		schoolService = module.get(LegacySchoolService);
		userService = module.get(UserService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getMigrations', () => {
		describe('when searching for a users migration', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();

				const migrations: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date(),
				});

				userLoginMigrationService.findMigrationByUser.mockResolvedValueOnce(migrations);

				return { userId, migrations };
			};

			it('should return a page response with data', async () => {
				const { userId, migrations } = setup();

				const result: Page<UserLoginMigrationDO> = await uc.getMigrations(userId, { userId });

				expect(result).toEqual<Page<UserLoginMigrationDO>>({
					data: [migrations],
					total: 1,
				});
			});
		});

		describe('when a user has no migration available', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();

				userLoginMigrationService.findMigrationByUser.mockResolvedValueOnce(null);

				return { userId };
			};

			it('should return a page response without data', async () => {
				const { userId } = setup();

				const result: Page<UserLoginMigrationDO> = await uc.getMigrations(userId, { userId });

				expect(result).toEqual<Page<UserLoginMigrationDO>>({
					data: [],
					total: 0,
				});
			});
		});

		describe('when searching for other users migrations', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();

				return { userId };
			};

			it('should throw a forbidden exception', async () => {
				const { userId } = setup();

				const func = async () => uc.getMigrations(userId, { userId: 'otherUserId' });

				await expect(func).rejects.toThrow(
					new ForbiddenException('Accessing migration status of another user is forbidden.')
				);
			});
		});
	});

	describe('findUserLoginMigrationBySchool', () => {
		describe('when searching for an existing user login migration', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();

				const migration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					schoolId,
					targetSystemId: 'targetSystemId',
					startedAt: new Date(),
				});
				const user: User = userFactory.buildWithId();

				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(migration);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return { user, schoolId, migration };
			};

			it('should should check the users permission', async () => {
				const { user, migration, schoolId } = setup();

				await uc.findUserLoginMigrationBySchool(user.id, schoolId);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(user, migration, {
					requiredPermissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
					action: Action.read,
				});
			});

			it('should return the user login migration', async () => {
				const { user, migration, schoolId } = setup();

				const result: UserLoginMigrationDO = await uc.findUserLoginMigrationBySchool(user.id, schoolId);

				expect(result).toEqual(migration);
			});
		});

		describe('when a user login migration does not exist', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();

				const user: User = userFactory.buildWithId();

				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(null);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return { user, schoolId };
			};

			it('should return throw not found exception', async () => {
				const { user, schoolId } = setup();

				const func = () => uc.findUserLoginMigrationBySchool(user.id, schoolId);

				await expect(func).rejects.toThrow(NotFoundLoggableException);
			});
		});

		describe('when the authorization fails', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();

				const user: User = userFactory.buildWithId();

				const migration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					schoolId,
					targetSystemId: 'targetSystemId',
					startedAt: new Date(),
				});

				const error = new Error('Authorization failed');

				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(migration);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.checkPermission.mockImplementation(() => {
					throw error;
				});

				return { user, schoolId, error };
			};

			it('should throw an error', async () => {
				const { user, schoolId, error } = setup();

				const func = () => uc.findUserLoginMigrationBySchool(user.id, schoolId);

				await expect(func).rejects.toThrow(error);
			});
		});
	});

	describe('migrate', () => {
		describe('when user migrates from one to another system', () => {
			const setup = () => {
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
					}),
					externalUser: new ExternalUserDto({
						externalId: 'externalUserId',
					}),
				});

				const tokenDto: OAuthTokenDto = new OAuthTokenDto({
					idToken: 'idToken',
					refreshToken: 'refreshToken',
					accessToken: 'accessToken',
				});

				const userLoginMigration = userLoginMigrationDOFactory.build({
					id: new ObjectId().toHexString(),
					targetSystemId: 'systemId',
					closedAt: undefined,
					finishedAt: undefined,
				});

				userLoginMigrationService.findMigrationByUser.mockResolvedValueOnce(userLoginMigration);
				oAuthService.authenticateUser.mockResolvedValueOnce(tokenDto);
				provisioningService.getData.mockResolvedValueOnce(oauthData);

				return {
					oauthData,
					tokenDto,
				};
			};

			it('should authenticate the user with oauth2', async () => {
				setup();

				await uc.migrate('jwt', 'currentUserId', 'systemId', 'code', 'redirectUri');

				expect(oAuthService.authenticateUser).toHaveBeenCalledWith('systemId', 'redirectUri', 'code');
			});

			it('should fetch the provisioning data for the user', async () => {
				const { tokenDto } = setup();

				await uc.migrate('jwt', 'currentUserId', 'systemId', 'code', 'redirectUri');

				expect(provisioningService.getData).toHaveBeenCalledWith('systemId', tokenDto.idToken, tokenDto.accessToken);
			});

			it('should migrate the user successfully', async () => {
				const { oauthData } = setup();

				await uc.migrate('jwt', 'currentUserId', 'systemId', 'code', 'redirectUri');

				expect(userMigrationService.migrateUser).toHaveBeenCalledWith(
					'currentUserId',
					oauthData.externalUser.externalId,
					'systemId'
				);
			});

			it('should remove the jwt from the whitelist', async () => {
				setup();

				await uc.migrate('jwt', 'currentUserId', 'systemId', 'code', 'redirectUri');

				expect(authenticationService.removeJwtFromWhitelist).toHaveBeenCalledWith('jwt');
			});
		});

		describe('when external school and official school number is defined and school has to be migrated', () => {
			const setup = () => {
				const sourceSystem: SystemEntity = systemEntityFactory
					.withOauthConfig()
					.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.SANIS });

				const schoolDO: LegacySchoolDo = legacySchoolDoFactory.buildWithId({
					systems: [sourceSystem.id],
					officialSchoolNumber: 'officialSchoolNumber',
					externalId: 'oldSchoolExternalId',
				});

				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
					}),
					externalUser: new ExternalUserDto({
						externalId: 'externalUserId',
					}),
					externalSchool: new ExternalSchoolDto({
						externalId: 'externalId',
						officialSchoolNumber: 'officialSchoolNumber',
						name: 'schoolName',
					}),
				});
				const tokenDto: OAuthTokenDto = new OAuthTokenDto({
					idToken: 'idToken',
					refreshToken: 'refreshToken',
					accessToken: 'accessToken',
				});

				const userLoginMigration = userLoginMigrationDOFactory.build({
					id: new ObjectId().toHexString(),
					targetSystemId: 'systemId',
					closedAt: undefined,
					finishedAt: undefined,
				});

				userLoginMigrationService.findMigrationByUser.mockResolvedValueOnce(userLoginMigration);
				oAuthService.authenticateUser.mockResolvedValueOnce(tokenDto);
				provisioningService.getData.mockResolvedValueOnce(oauthData);
				schoolMigrationService.getSchoolForMigration.mockResolvedValueOnce(schoolDO);

				return {
					schoolDO,
					oauthData,
				};
			};

			it('should get the school that should be migrated', async () => {
				const { oauthData } = setup();

				await uc.migrate('jwt', 'currentUserId', 'systemId', 'code', 'redirectUri');

				expect(schoolMigrationService.getSchoolForMigration).toHaveBeenCalledWith(
					'currentUserId',
					oauthData.externalSchool?.externalId,
					oauthData.externalSchool?.officialSchoolNumber
				);
			});

			it('should migrate the school', async () => {
				const { oauthData, schoolDO } = setup();

				await uc.migrate('jwt', 'currentUserId', 'systemId', 'code', 'redirectUri');

				expect(schoolMigrationService.migrateSchool).toHaveBeenCalledWith(
					schoolDO,
					oauthData.externalSchool?.externalId,
					'systemId'
				);
			});
		});

		describe('when external school and official school number is defined and school is already migrated', () => {
			const setup = () => {
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
					}),
					externalUser: new ExternalUserDto({
						externalId: 'externalUserId',
					}),
					externalSchool: new ExternalSchoolDto({
						externalId: 'externalId',
						officialSchoolNumber: 'officialSchoolNumber',
						name: 'schoolName',
					}),
				});

				const tokenDto: OAuthTokenDto = new OAuthTokenDto({
					idToken: 'idToken',
					refreshToken: 'refreshToken',
					accessToken: 'accessToken',
				});

				const userLoginMigration = userLoginMigrationDOFactory.build({
					id: new ObjectId().toHexString(),
					targetSystemId: 'systemId',
					closedAt: undefined,
					finishedAt: undefined,
				});

				userLoginMigrationService.findMigrationByUser.mockResolvedValueOnce(userLoginMigration);
				oAuthService.authenticateUser.mockResolvedValueOnce(tokenDto);
				provisioningService.getData.mockResolvedValueOnce(oauthData);
				schoolMigrationService.getSchoolForMigration.mockResolvedValueOnce(null);

				return {
					oauthData,
				};
			};

			it('should not migrate the school', async () => {
				setup();

				await uc.migrate('jwt', 'currentUserId', 'systemId', 'code', 'redirectUri');

				expect(schoolMigrationService.migrateSchool).not.toHaveBeenCalled();
			});
		});

		describe('when external school is not defined', () => {
			const setup = () => {
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
					}),
					externalUser: new ExternalUserDto({
						externalId: 'externalUserId',
					}),
				});

				const tokenDto: OAuthTokenDto = new OAuthTokenDto({
					idToken: 'idToken',
					refreshToken: 'refreshToken',
					accessToken: 'accessToken',
				});

				const userLoginMigration = userLoginMigrationDOFactory.build({
					id: new ObjectId().toHexString(),
					targetSystemId: 'systemId',
					closedAt: undefined,
					finishedAt: undefined,
				});

				userLoginMigrationService.findMigrationByUser.mockResolvedValueOnce(userLoginMigration);
				oAuthService.authenticateUser.mockResolvedValueOnce(tokenDto);
				provisioningService.getData.mockResolvedValueOnce(oauthData);
				schoolMigrationService.getSchoolForMigration.mockResolvedValueOnce(null);
			};

			it('should try to migrate the school', async () => {
				setup();

				await uc.migrate('jwt', 'currentUserId', 'systemId', 'code', 'redirectUri');

				expect(schoolMigrationService.getSchoolForMigration).not.toHaveBeenCalled();
				expect(schoolMigrationService.migrateSchool).not.toHaveBeenCalled();
			});
		});

		describe('when a external school is defined, but has no official school number', () => {
			const setup = () => {
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
					}),
					externalUser: new ExternalUserDto({
						externalId: 'externalUserId',
					}),
					externalSchool: new ExternalSchoolDto({
						externalId: 'externalId',
						name: 'schoolName',
					}),
				});

				const tokenDto: OAuthTokenDto = new OAuthTokenDto({
					idToken: 'idToken',
					refreshToken: 'refreshToken',
					accessToken: 'accessToken',
				});

				const userLoginMigration = userLoginMigrationDOFactory.build({
					id: new ObjectId().toHexString(),
					targetSystemId: 'systemId',
					closedAt: undefined,
					finishedAt: undefined,
				});

				userLoginMigrationService.findMigrationByUser.mockResolvedValueOnce(userLoginMigration);
				oAuthService.authenticateUser.mockResolvedValueOnce(tokenDto);
				provisioningService.getData.mockResolvedValueOnce(oauthData);
				schoolMigrationService.getSchoolForMigration.mockResolvedValueOnce(null);

				return {
					oauthData,
				};
			};

			it('should throw an error', async () => {
				const { oauthData } = setup();

				await expect(uc.migrate('jwt', 'currentUserId', 'systemId', 'code', 'redirectUri')).rejects.toThrow(
					new ExternalSchoolNumberMissingLoggableException(oauthData.externalSchool?.externalId as string)
				);
			});
		});

		describe('when no user login migration is running', () => {
			const setup = () => {
				userLoginMigrationService.findMigrationByUser.mockResolvedValueOnce(null);
			};

			it('should throw an error', async () => {
				setup();

				await expect(uc.migrate('jwt', 'currentUserId', 'systemId', 'code', 'redirectUri')).rejects.toThrow(
					InvalidUserLoginMigrationLoggableException
				);
			});
		});

		describe('when the user login migration is closed', () => {
			const setup = () => {
				const userLoginMigration = userLoginMigrationDOFactory.build({
					id: new ObjectId().toHexString(),
					targetSystemId: 'systemId',
					closedAt: new Date(),
				});

				userLoginMigrationService.findMigrationByUser.mockResolvedValueOnce(userLoginMigration);
			};

			it('should throw an error', async () => {
				setup();

				await expect(uc.migrate('jwt', 'currentUserId', 'systemId', 'code', 'redirectUri')).rejects.toThrow(
					InvalidUserLoginMigrationLoggableException
				);
			});
		});

		describe('when trying to migrate to the wrong system', () => {
			const setup = () => {
				const userLoginMigration = userLoginMigrationDOFactory.build({
					id: new ObjectId().toHexString(),
					targetSystemId: 'wrongSystemId',
					closedAt: undefined,
					finishedAt: undefined,
				});

				userLoginMigrationService.findMigrationByUser.mockResolvedValueOnce(userLoginMigration);
			};

			it('should throw an error', async () => {
				setup();

				await expect(uc.migrate('jwt', 'currentUserId', 'systemId', 'code', 'redirectUri')).rejects.toThrow(
					InvalidUserLoginMigrationLoggableException
				);
			});
		});
	});

	describe('forceMigration', () => {
		describe('when the school is not migrated without an active user login migration', () => {
			const setupNonMigratedSchool = () => {
				const school = legacySchoolDoFactory.buildWithId();

				const userLoginMigration = userLoginMigrationDOFactory.buildWithId({
					schoolId: school.id,
				});

				schoolService.getSchoolById.mockResolvedValueOnce(school);

				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(null);
				userLoginMigrationService.startMigration.mockResolvedValueOnce(userLoginMigration);

				schoolMigrationService.hasSchoolMigratedInMigrationPhase.mockReturnValueOnce(false);
				schoolMigrationService.hasSchoolMigrated.mockReturnValueOnce(false);

				return {
					school,
					userLoginMigration,
				};
			};

			describe('when the user found by provided email can be migrated', () => {
				const setup = () => {
					const { school, userLoginMigration } = setupNonMigratedSchool();

					const caller = userFactory.buildWithId({
						school: schoolEntityFactory.buildWithId({}, school.id),
					});

					const externalUserId = 'externalUserId';
					const externalSchoolId = 'externalSchoolId';

					const user = userDoFactory.buildWithId({
						schoolId: school.id,
					});

					authorizationService.getUserWithPermissions.mockResolvedValueOnce(caller);
					userService.findByEmail.mockResolvedValueOnce([user]);
					userMigrationService.hasUserMigratedInMigrationPhase.mockReturnValueOnce(false);

					return {
						caller,
						user,
						externalUserId,
						externalSchoolId,
						userLoginMigration,
						school,
					};
				};

				it('should check permission of the calling user', async () => {
					const { caller, user, externalUserId, externalSchoolId } = setup();

					await uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

					expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(caller, [
						Permission.USER_LOGIN_MIGRATION_FORCE,
					]);
				});

				it('should start migration for the school', async () => {
					const { caller, user, externalUserId, externalSchoolId } = setup();

					await uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

					expect(userLoginMigrationService.startMigration).toHaveBeenCalledWith(user.schoolId);
				});

				it('should migrate the school', async () => {
					const { caller, user, externalUserId, externalSchoolId, userLoginMigration, school } = setup();

					await uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

					expect(schoolMigrationService.migrateSchool).toHaveBeenCalledWith(
						school,
						externalSchoolId,
						userLoginMigration.targetSystemId
					);
				});

				it('should migrate the user', async () => {
					const { caller, user, externalUserId, externalSchoolId, userLoginMigration } = setup();

					await uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

					expect(userMigrationService.migrateUser).toHaveBeenCalledWith(
						user.id,
						externalUserId,
						userLoginMigration.targetSystemId
					);
				});
			});
		});

		describe('when the school is not migrated but with an active user login migration', () => {
			const setupMigratedSchool = () => {
				const school = legacySchoolDoFactory.buildWithId();

				const userLoginMigration = userLoginMigrationDOFactory.buildWithId({
					schoolId: school.id,
				});

				schoolService.getSchoolById.mockResolvedValueOnce(school);

				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(userLoginMigration);
				userLoginMigrationService.startMigration.mockResolvedValueOnce(userLoginMigration);

				schoolMigrationService.hasSchoolMigratedInMigrationPhase.mockReturnValueOnce(false);
				schoolMigrationService.hasSchoolMigrated.mockReturnValueOnce(false);

				return {
					school,
					userLoginMigration,
				};
			};

			describe('when the user found by provided email had not been migrated', () => {
				const setup = () => {
					const { school, userLoginMigration } = setupMigratedSchool();

					const caller = userFactory.buildWithId({
						school: schoolEntityFactory.buildWithId({}, school.id),
					});

					const user = userDoFactory.buildWithId({
						schoolId: school.id,
					});

					const externalUserId = 'externalUserId';
					const externalSchoolId = 'externalSchoolId';

					authorizationService.getUserWithPermissions.mockResolvedValueOnce(caller);
					userService.findByEmail.mockResolvedValueOnce([user]);
					userMigrationService.hasUserMigratedInMigrationPhase.mockReturnValueOnce(false);

					return {
						caller,
						user,
						externalUserId,
						externalSchoolId,
						userLoginMigration,
						school,
					};
				};

				it('should check permission of the calling user', async () => {
					const { caller, user, externalUserId, externalSchoolId } = setup();

					await uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

					expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(caller, [
						Permission.USER_LOGIN_MIGRATION_FORCE,
					]);
				});

				it('should not start migration for the school', async () => {
					const { caller, user, externalUserId, externalSchoolId } = setup();

					await uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

					expect(userLoginMigrationService.startMigration).not.toHaveBeenCalled();
				});

				it('should migrate the school', async () => {
					const { caller, user, externalUserId, externalSchoolId, userLoginMigration, school } = setup();

					await uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

					expect(schoolMigrationService.migrateSchool).toHaveBeenCalledWith(
						school,
						externalSchoolId,
						userLoginMigration.targetSystemId
					);
				});

				it('should migrate the user', async () => {
					const { caller, user, externalUserId, externalSchoolId, userLoginMigration } = setup();

					await uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

					expect(userMigrationService.migrateUser).toHaveBeenCalledWith(
						user.id,
						externalUserId,
						userLoginMigration.targetSystemId
					);
				});
			});

			describe('when the user found by provided email had been migrated', () => {
				const setup = () => {
					const { school, userLoginMigration } = setupMigratedSchool();

					const caller = userFactory.buildWithId({
						school: schoolEntityFactory.buildWithId({}, school.id),
					});

					const user = userDoFactory.buildWithId({
						schoolId: school.id,
						externalId: 'otherExternalId',
					});

					const externalUserId = 'externalUserId';
					const externalSchoolId = 'externalSchoolId';

					authorizationService.getUserWithPermissions.mockResolvedValueOnce(caller);
					userService.findByEmail.mockResolvedValueOnce([user]);
					userMigrationService.hasUserMigratedInMigrationPhase.mockReturnValueOnce(true);

					return {
						caller,
						user,
						externalUserId,
						externalSchoolId,
						userLoginMigration,
						school,
					};
				};

				it('should check permission of the calling user', async () => {
					const { caller, user, externalUserId, externalSchoolId } = setup();

					await uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

					expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(caller, [
						Permission.USER_LOGIN_MIGRATION_FORCE,
					]);
				});

				it('should not start migration for the school', async () => {
					const { caller, user, externalUserId, externalSchoolId } = setup();

					await uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

					expect(userLoginMigrationService.startMigration).not.toHaveBeenCalled();
				});

				it('should migrate the school', async () => {
					const { caller, user, externalUserId, externalSchoolId, userLoginMigration, school } = setup();

					await uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

					expect(schoolMigrationService.migrateSchool).toHaveBeenCalledWith(
						school,
						externalSchoolId,
						userLoginMigration.targetSystemId
					);
				});

				it('should not migrate the user', async () => {
					const { caller, user, externalUserId, externalSchoolId } = setup();

					await uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

					expect(userMigrationService.migrateUser).not.toHaveBeenCalled();
				});

				it('should correct the migrated user', async () => {
					const { caller, user, externalUserId, externalSchoolId } = setup();

					await uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

					expect(userMigrationService.updateExternalUserId).toHaveBeenCalledWith(user.id, externalUserId);
				});
			});
		});

		describe('when the school is migrated', () => {
			const setupMigratedSchool = () => {
				const school = legacySchoolDoFactory.buildWithId();

				const userLoginMigration = userLoginMigrationDOFactory.buildWithId({
					schoolId: school.id,
				});

				schoolService.getSchoolById.mockResolvedValueOnce(school);

				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(userLoginMigration);
				userLoginMigrationService.startMigration.mockResolvedValueOnce(userLoginMigration);

				schoolMigrationService.hasSchoolMigratedInMigrationPhase.mockReturnValueOnce(true);
				schoolMigrationService.hasSchoolMigrated.mockReturnValueOnce(false);

				return {
					school,
					userLoginMigration,
				};
			};

			describe('when the user found by provided email had not been migrated', () => {
				const setup = () => {
					const { school, userLoginMigration } = setupMigratedSchool();

					const caller = userFactory.buildWithId({
						school: schoolEntityFactory.buildWithId({}, school.id),
					});

					const user = userDoFactory.buildWithId({
						schoolId: school.id,
					});

					const externalUserId = 'externalUserId';
					const externalSchoolId = 'externalSchoolId';

					authorizationService.getUserWithPermissions.mockResolvedValueOnce(caller);
					userService.findByEmail.mockResolvedValueOnce([user]);
					userMigrationService.hasUserMigratedInMigrationPhase.mockReturnValueOnce(false);

					return {
						caller,
						user,
						externalUserId,
						externalSchoolId,
						userLoginMigration,
						school,
					};
				};

				it('should check permission of the calling user', async () => {
					const { caller, user, externalUserId, externalSchoolId } = setup();

					await uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

					expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(caller, [
						Permission.USER_LOGIN_MIGRATION_FORCE,
					]);
				});

				it('should not start migration for the school', async () => {
					const { caller, user, externalUserId, externalSchoolId } = setup();

					await uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

					expect(userLoginMigrationService.startMigration).not.toHaveBeenCalled();
				});

				it('should not migrate the school', async () => {
					const { caller, user, externalUserId, externalSchoolId } = setup();

					await uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

					expect(schoolMigrationService.migrateSchool).not.toHaveBeenCalled();
				});

				it('should migrate the user', async () => {
					const { caller, user, externalUserId, externalSchoolId, userLoginMigration } = setup();

					await uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

					expect(userMigrationService.migrateUser).toHaveBeenCalledWith(
						user.id,
						externalUserId,
						userLoginMigration.targetSystemId
					);
				});
			});

			describe('when the user found by provided email had been migrated', () => {
				const setup = () => {
					const { school, userLoginMigration } = setupMigratedSchool();

					const caller = userFactory.buildWithId({
						school: schoolEntityFactory.buildWithId({}, school.id),
					});

					const user = userDoFactory.buildWithId({
						schoolId: school.id,
						externalId: 'otherExternalId',
					});

					const externalUserId = 'externalUserId';
					const externalSchoolId = 'externalSchoolId';

					authorizationService.getUserWithPermissions.mockResolvedValueOnce(caller);
					userService.findByEmail.mockResolvedValueOnce([user]);
					userMigrationService.hasUserMigratedInMigrationPhase.mockReturnValueOnce(true);

					return {
						caller,
						user,
						externalUserId,
						externalSchoolId,
						userLoginMigration,
						school,
					};
				};

				it('should check permission of the calling user', async () => {
					const { caller, user, externalUserId, externalSchoolId } = setup();

					await uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

					expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(caller, [
						Permission.USER_LOGIN_MIGRATION_FORCE,
					]);
				});

				it('should not start migration for the school', async () => {
					const { caller, user, externalUserId, externalSchoolId } = setup();

					await uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

					expect(userLoginMigrationService.startMigration).not.toHaveBeenCalled();
				});

				it('should not migrate the school', async () => {
					const { caller, user, externalUserId, externalSchoolId } = setup();

					await uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

					expect(schoolMigrationService.migrateSchool).not.toHaveBeenCalled();
				});

				it('should not migrate the user', async () => {
					const { caller, user, externalUserId, externalSchoolId } = setup();

					await uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

					expect(userMigrationService.migrateUser).not.toHaveBeenCalled();
				});

				it('should correct the migrated user', async () => {
					const { caller, user, externalUserId, externalSchoolId } = setup();

					await uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

					expect(userMigrationService.updateExternalUserId).toHaveBeenCalledWith(user.id, externalUserId);
				});
			});
		});

		describe('when the provided external school id is already being used by the school', () => {
			const setup = () => {
				const externalUserId = 'externalUserId';
				const externalSchoolId = 'externalSchoolId';

				const school = legacySchoolDoFactory.buildWithId({
					externalId: externalSchoolId,
				});

				const userLoginMigration = userLoginMigrationDOFactory.buildWithId({
					schoolId: school.id,
				});

				const caller = userFactory.buildWithId({
					school: schoolEntityFactory.buildWithId({}, school.id),
				});

				const user = userDoFactory.buildWithId({
					schoolId: school.id,
				});

				schoolService.getSchoolById.mockResolvedValueOnce(school);

				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(userLoginMigration);
				userLoginMigrationService.startMigration.mockResolvedValueOnce(userLoginMigration);

				schoolMigrationService.hasSchoolMigratedInMigrationPhase.mockReturnValueOnce(true);
				schoolMigrationService.hasSchoolMigrated.mockReturnValueOnce(true);

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(caller);
				userService.findByEmail.mockResolvedValueOnce([user]);
				userMigrationService.hasUserMigratedInMigrationPhase.mockReturnValueOnce(false);

				return {
					caller,
					user,
					externalUserId,
					externalSchoolId,
					userLoginMigration,
					school,
				};
			};

			it('should throw an error for already migrated schools', async () => {
				const { caller, user, externalUserId, externalSchoolId } = setup();

				const forceMigrationPromise = uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

				await expect(forceMigrationPromise).rejects.toThrow(UserLoginMigrationSchoolAlreadyMigratedLoggableException);
			});
		});

		describe('when the school has a closed or finished migration', () => {
			const setup = () => {
				const school = legacySchoolDoFactory.buildWithId();

				const now = new Date();
				const later = new Date();
				later.setDate(now.getDate() + 1);
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId({
					schoolId: school.id,
					closedAt: now,
					finishedAt: later,
				});

				const caller = userFactory.buildWithId({
					school: schoolEntityFactory.buildWithId({}, school.id),
				});

				const user = userDoFactory.buildWithId({
					schoolId: school.id,
				});

				const externalUserId = 'externalUserId';
				const externalSchoolId = 'externalSchoolId';

				schoolService.getSchoolById.mockResolvedValueOnce(school);

				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(userLoginMigration);
				userLoginMigrationService.startMigration.mockResolvedValueOnce(userLoginMigration);

				schoolMigrationService.hasSchoolMigratedInMigrationPhase.mockReturnValueOnce(true);
				schoolMigrationService.hasSchoolMigrated.mockReturnValueOnce(false);

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(caller);
				userService.findByEmail.mockResolvedValueOnce([user]);
				userMigrationService.hasUserMigratedInMigrationPhase.mockReturnValueOnce(true);

				return {
					caller,
					user,
					externalUserId,
					externalSchoolId,
					userLoginMigration,
					school,
				};
			};

			it('should throw an error for already closed migration', async () => {
				const { caller, user, externalUserId, externalSchoolId } = setup();

				const forceMigrationPromise = uc.forceMigration(caller.id, user.email, externalUserId, externalSchoolId);

				await expect(forceMigrationPromise).rejects.toThrow(UserLoginMigrationAlreadyClosedLoggableException);
			});
		});

		describe('when there is no user with the email', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const externalUserId = 'externalUserId';
				const externalSchoolId = 'externalSchoolId';

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				userService.findByEmail.mockResolvedValueOnce([]);

				return {
					user,
					externalUserId,
					externalSchoolId,
				};
			};

			it('should throw an error', async () => {
				const { user, externalUserId, externalSchoolId } = setup();

				await expect(uc.forceMigration(user.id, user.email, externalUserId, externalSchoolId)).rejects.toThrow(
					NotFoundLoggableException
				);
			});
		});

		describe('when there are multiple users with the email', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const userDo = userDoFactory.build({
					id: user.id,
					roles: [
						new RoleReference({
							id: new ObjectId().toHexString(),
							name: RoleName.ADMINISTRATOR,
						}),
					],
				});
				const externalUserId = 'externalUserId';
				const externalSchoolId = 'externalSchoolId';

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				userService.findByEmail.mockResolvedValueOnce([userDo, userDo]);

				return {
					user,
					externalUserId,
					externalSchoolId,
				};
			};

			it('should throw an error', async () => {
				const { user, externalUserId, externalSchoolId } = setup();

				await expect(uc.forceMigration(user.id, user.email, externalUserId, externalSchoolId)).rejects.toThrow(
					UserLoginMigrationMultipleEmailUsersLoggableException
				);
			});
		});

		describe('when there is no user id', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const userDo = userDoFactory.build({
					id: undefined,
					roles: [
						new RoleReference({
							id: new ObjectId().toHexString(),
							name: RoleName.ADMINISTRATOR,
						}),
					],
				});
				const externalUserId = 'externalUserId';
				const externalSchoolId = 'externalSchoolId';

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				userService.findByEmail.mockResolvedValueOnce([userDo]);

				return {
					user,
					externalUserId,
					externalSchoolId,
				};
			};

			it('should throw an error', async () => {
				const { user, externalUserId, externalSchoolId } = setup();

				await expect(uc.forceMigration(user.id, user.email, externalUserId, externalSchoolId)).rejects.toThrow(
					NotFoundLoggableException
				);
			});
		});
	});
});
