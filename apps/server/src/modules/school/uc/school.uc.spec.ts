import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserLoginMigrationDO } from '@shared/domain';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { schoolDOFactory } from '@shared/testing/factory/domainobject/school.factory';
import { AuthorizationService } from '@src/modules/authorization';
import { SchoolService } from '@src/modules/school/service/school.service';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import {
	SchoolMigrationService,
	UserLoginMigrationRevertService,
	UserLoginMigrationService,
} from '@src/modules/user-login-migration';
import { userLoginMigrationDOFactory } from '@shared/testing/factory/domainobject/user-login-migration.factory';
import { OauthMigrationDto } from './dto/oauth-migration.dto';

describe('SchoolUc', () => {
	let module: TestingModule;
	let schoolUc: SchoolUc;

	let schoolService: DeepMocked<SchoolService>;
	let authService: DeepMocked<AuthorizationService>;
	let schoolMigrationService: DeepMocked<SchoolMigrationService>;
	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;
	let userLoginMigrationRevertService: DeepMocked<UserLoginMigrationRevertService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolUc,
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: SchoolMigrationService,
					useValue: createMock<SchoolMigrationService>(),
				},
				{
					provide: UserLoginMigrationService,
					useValue: createMock<UserLoginMigrationService>(),
				},
				{
					provide: UserLoginMigrationRevertService,
					useValue: createMock<UserLoginMigrationRevertService>(),
				},
			],
		}).compile();

		schoolService = module.get(SchoolService);
		authService = module.get(AuthorizationService);
		schoolUc = module.get(SchoolUc);
		schoolMigrationService = module.get(SchoolMigrationService);
		userLoginMigrationService = module.get(UserLoginMigrationService);
		userLoginMigrationRevertService = module.get(UserLoginMigrationRevertService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('setMigration is called', () => {
		describe('when first starting the migration', () => {
			const setup = () => {
				const school: SchoolDO = schoolDOFactory.buildWithId();
				const userLoginMigration: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date('2023-05-02'),
				});

				userLoginMigrationService.findMigrationBySchool.mockResolvedValue(null);
				authService.checkPermissionByReferences.mockImplementation(() => Promise.resolve());
				schoolService.getSchoolById.mockResolvedValue(school);
				userLoginMigrationService.setMigration.mockResolvedValue(userLoginMigration);
			};

			it('should return the migration dto', async () => {
				setup();

				const result: OauthMigrationDto = await schoolUc.setMigration('schoolId', true, false, false, 'userId');

				expect(result).toEqual<OauthMigrationDto>({
					oauthMigrationPossible: new Date('2023-05-02'),
					enableMigrationStart: true,
				});
			});
		});

		describe('when closing a migration', () => {
			describe('when there were migrated users', () => {
				const setup = () => {
					const school: SchoolDO = schoolDOFactory.buildWithId();
					const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.build({
						closedAt: undefined,
					});
					const updatedUserLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.build({
						targetSystemId: userLoginMigration.targetSystemId,
					});

					userLoginMigrationService.findMigrationBySchool.mockResolvedValue(userLoginMigration);
					authService.checkPermissionByReferences.mockImplementation(() => Promise.resolve());
					schoolService.getSchoolById.mockResolvedValue(school);
					userLoginMigrationService.setMigration.mockResolvedValue(updatedUserLoginMigration);
					schoolMigrationService.hasSchoolMigratedUser.mockResolvedValue(true);

					return {
						updatedUserLoginMigration,
					};
				};

				it('should call schoolMigrationService.markUnmigratedUsersAsOutdated', async () => {
					const { updatedUserLoginMigration } = setup();

					await schoolUc.setMigration(updatedUserLoginMigration.schoolId, true, false, true, 'userId');

					expect(schoolMigrationService.markUnmigratedUsersAsOutdated).toHaveBeenCalled();
				});
			});

			describe('when there were no users migrated', () => {
				const setup = () => {
					const school: SchoolDO = schoolDOFactory.buildWithId();
					const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.build({
						closedAt: undefined,
					});
					const updatedUserLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.build({
						targetSystemId: userLoginMigration.targetSystemId,
					});

					userLoginMigrationService.findMigrationBySchool.mockResolvedValue(userLoginMigration);
					authService.checkPermissionByReferences.mockImplementation(() => Promise.resolve());
					schoolService.getSchoolById.mockResolvedValue(school);
					userLoginMigrationService.setMigration.mockResolvedValue(updatedUserLoginMigration);
					schoolMigrationService.hasSchoolMigratedUser.mockResolvedValue(false);

					return {
						updatedUserLoginMigration,
					};
				};

				it('should call userLoginMigrationRevertService.revertUserLoginMigration', async () => {
					const { updatedUserLoginMigration } = setup();

					await schoolUc.setMigration(updatedUserLoginMigration.schoolId, true, false, true, 'userId');

					expect(userLoginMigrationRevertService.revertUserLoginMigration).toHaveBeenCalledWith(
						updatedUserLoginMigration
					);
				});
			});
		});

		describe('when restarting a migration', () => {
			const setup = () => {
				const school: SchoolDO = schoolDOFactory.buildWithId();
				const userLoginMigration: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date('2023-05-02'),
					closedAt: new Date('2023-05-02'),
					finishedAt: new Date('2023-05-02'),
				});
				const updatedUserLoginMigration: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date('2023-05-02'),
				});

				userLoginMigrationService.findMigrationBySchool.mockResolvedValue(userLoginMigration);
				authService.checkPermissionByReferences.mockImplementation(() => Promise.resolve());
				schoolService.getSchoolById.mockResolvedValue(school);
				userLoginMigrationService.setMigration.mockResolvedValue(updatedUserLoginMigration);
			};

			it('should call schoolMigrationService.unmarkOutdatedUsers', async () => {
				setup();

				await schoolUc.setMigration('schoolId', true, false, false, 'userId');

				expect(schoolMigrationService.unmarkOutdatedUsers).toHaveBeenCalled();
			});
		});

		describe('when trying to start a finished migration after the grace period', () => {
			const setup = () => {
				const school: SchoolDO = schoolDOFactory.buildWithId();
				const userLoginMigration: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date('2023-05-02'),
					closedAt: new Date('2023-05-02'),
					finishedAt: new Date('2023-05-02'),
				});
				const updatedUserLoginMigration: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date('2023-05-02'),
				});

				userLoginMigrationService.findMigrationBySchool.mockResolvedValue(userLoginMigration);
				authService.checkPermissionByReferences.mockImplementation(() => Promise.resolve());
				schoolService.getSchoolById.mockResolvedValue(school);
				userLoginMigrationService.setMigration.mockResolvedValue(updatedUserLoginMigration);
				schoolMigrationService.validateGracePeriod.mockImplementation(() => {
					throw new UnprocessableEntityException();
				});
			};

			it('should throw an error', async () => {
				setup();

				const func = async () => schoolUc.setMigration('schoolId', true, false, false, 'userId');

				await expect(func).rejects.toThrow(UnprocessableEntityException);
			});
		});
	});

	describe('getMigration is called', () => {
		describe('when the school has a migration', () => {
			const setup = () => {
				const school: SchoolDO = schoolDOFactory.buildWithId();
				const userLoginMigration: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date('2023-05-02'),
					mandatorySince: new Date('2023-05-02'),
					closedAt: new Date('2023-05-02'),
					finishedAt: new Date('2023-05-02'),
				});

				userLoginMigrationService.findMigrationBySchool.mockResolvedValue(userLoginMigration);
				schoolService.getSchoolById.mockResolvedValue(school);
				authService.checkPermissionByReferences.mockImplementation(() => Promise.resolve());
			};

			it('should return a migration', async () => {
				setup();

				const result: OauthMigrationDto = await schoolUc.getMigration('schoolId', 'userId');

				expect(result).toEqual<OauthMigrationDto>({
					oauthMigrationPossible: undefined,
					oauthMigrationMandatory: new Date('2023-05-02'),
					oauthMigrationFinished: new Date('2023-05-02'),
					oauthMigrationFinalFinish: new Date('2023-05-02'),
					enableMigrationStart: true,
				});
			});
		});

		describe('when the school has no migration', () => {
			const setup = () => {
				const school: SchoolDO = schoolDOFactory.buildWithId();

				userLoginMigrationService.findMigrationBySchool.mockResolvedValue(null);
				schoolService.getSchoolById.mockResolvedValue(school);
				authService.checkPermissionByReferences.mockImplementation(() => Promise.resolve());
			};

			it('should return no migration information', async () => {
				setup();

				const result: OauthMigrationDto = await schoolUc.getMigration('schoolId', 'userId');

				expect(result).toEqual<OauthMigrationDto>({
					enableMigrationStart: true,
				});
			});
		});
	});
});
