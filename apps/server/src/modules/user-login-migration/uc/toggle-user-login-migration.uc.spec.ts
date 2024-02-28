import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { LegacySchoolService } from '@modules/legacy-school';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacySchoolDo, UserLoginMigrationDO } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { legacySchoolDoFactory, setupEntities, userFactory, userLoginMigrationDOFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { UserLoginMigrationNotFoundLoggableException } from '../loggable';
import { UserLoginMigrationService } from '../service';
import { ToggleUserLoginMigrationUc } from './toggle-user-login-migration.uc';

describe(ToggleUserLoginMigrationUc.name, () => {
	let module: TestingModule;
	let uc: ToggleUserLoginMigrationUc;

	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolService: DeepMocked<LegacySchoolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ToggleUserLoginMigrationUc,
				{
					provide: UserLoginMigrationService,
					useValue: createMock<UserLoginMigrationService>(),
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
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		uc = module.get(ToggleUserLoginMigrationUc);
		userLoginMigrationService = module.get(UserLoginMigrationService);
		authorizationService = module.get(AuthorizationService);
		schoolService = module.get(LegacySchoolService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('setMigrationMandatory', () => {
		describe('when an admin sets a migration from optional to mandatory', () => {
			const setup = () => {
				const migrationBeforeMandatory: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId();
				const migrationAfterMandatory: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					mandatorySince: new Date(2023, 5),
				});

				const user: User = userFactory.buildWithId();

				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(migrationBeforeMandatory);
				userLoginMigrationService.setMigrationMandatory.mockResolvedValueOnce(migrationAfterMandatory);

				return { user, school, migrationAfterMandatory, migrationBeforeMandatory };
			};

			it('should check permission', async () => {
				const { user, school } = setup();

				await uc.setMigrationMandatory(new ObjectId().toHexString(), new ObjectId().toHexString(), true);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					school,
					AuthorizationContextBuilder.write([Permission.USER_LOGIN_MIGRATION_ADMIN])
				);
			});

			it('should call the service to set a migration mandatory', async () => {
				const { migrationBeforeMandatory } = setup();

				await uc.setMigrationMandatory(new ObjectId().toHexString(), new ObjectId().toHexString(), true);

				expect(userLoginMigrationService.setMigrationMandatory).toHaveBeenCalledWith(migrationBeforeMandatory, true);
			});

			it('should return a UserLoginMigration', async () => {
				const { migrationAfterMandatory } = setup();

				const result: UserLoginMigrationDO = await uc.setMigrationMandatory(
					new ObjectId().toHexString(),
					new ObjectId().toHexString(),
					true
				);

				expect(result).toEqual(migrationAfterMandatory);
			});
		});

		describe('when an admin sets a migration from mandatory to optional', () => {
			const setup = () => {
				const migrationBeforeOptional: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					mandatorySince: new Date(2023, 5),
				});
				const migrationAfterOptional: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId();

				const user: User = userFactory.buildWithId();

				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(migrationBeforeOptional);
				userLoginMigrationService.setMigrationMandatory.mockResolvedValueOnce(migrationAfterOptional);

				return { user, school, migrationAfterOptional, migrationBeforeOptional };
			};

			it('should check permission', async () => {
				const { user, school } = setup();

				await uc.setMigrationMandatory(new ObjectId().toHexString(), new ObjectId().toHexString(), false);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					school,
					AuthorizationContextBuilder.write([Permission.USER_LOGIN_MIGRATION_ADMIN])
				);
			});

			it('should call the service to set a migration optional', async () => {
				const { migrationBeforeOptional } = setup();

				await uc.setMigrationMandatory(new ObjectId().toHexString(), new ObjectId().toHexString(), false);

				expect(userLoginMigrationService.setMigrationMandatory).toHaveBeenCalledWith(migrationBeforeOptional, false);
			});

			it('should return a UserLoginMigration', async () => {
				const { migrationAfterOptional } = setup();

				const result: UserLoginMigrationDO = await uc.setMigrationMandatory(
					new ObjectId().toHexString(),
					new ObjectId().toHexString(),
					false
				);

				expect(result).toEqual(migrationAfterOptional);
			});
		});

		describe('when the user does not have enough permission', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();

				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				authorizationService.checkPermission.mockImplementationOnce(() => {
					throw new ForbiddenException();
				});
			};

			it('should throw an exception', async () => {
				setup();

				await expect(
					uc.setMigrationMandatory(new ObjectId().toHexString(), new ObjectId().toHexString(), true)
				).rejects.toThrow(ForbiddenException);
			});
		});

		describe('when there is no migration yet', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();

				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(null);
			};

			it('should throw a UserLoginMigrationNotFoundLoggableException', async () => {
				setup();

				await expect(
					uc.setMigrationMandatory(new ObjectId().toHexString(), new ObjectId().toHexString(), true)
				).rejects.toThrow(UserLoginMigrationNotFoundLoggableException);
			});
		});
	});
});
