import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ObjectId } from '@mikro-orm/mongodb';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { SchoolFeatures, UserLoginMigrationDO } from '@shared/domain';
import { Page } from '@shared/domain/domainobject/page';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { userDoFactory } from '@shared/testing';
import { schoolDOFactory } from '@shared/testing/factory/domainobject/school.factory';
import { SchoolService } from '@src/modules/school';
import { SystemService } from '@src/modules/system';
import { SystemDto } from '@src/modules/system/service';
import { UserService } from '@src/modules/user';
import { MigrationResponse } from '../../school/controller/dto';
import { OauthMigrationDto } from './dto';
import { UserLoginMigrationService } from './user-login-migration.service';

describe('UserLoginMigrationService', () => {
	let module: TestingModule;
	let service: UserLoginMigrationService;

	let userService: DeepMocked<UserService>;
	let schoolService: DeepMocked<SchoolService>;
	let systemService: DeepMocked<SystemService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserLoginMigrationService,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
			],
		}).compile();

		service = module.get(UserLoginMigrationService);
		userService = module.get(UserService);
		schoolService = module.get(SchoolService);
		systemService = module.get(SystemService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findUserLoginMigrations', () => {
		describe('when using a query with user id and the users school is in migration and the user has not migrated yet', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const user: UserDO = userDoFactory.buildWithId(undefined, userId);

				const sourceSystemId = 'sourceSystemId';
				const migrationMandatoryDate: Date = new Date('2023-04-08');
				const migrationStartDate: Date = new Date('2023-04-05');
				const migrationClosedDate: Date = new Date('2023-04-06');
				const migrationFinishDate: Date = new Date('2023-04-07');
				const school: SchoolDO = schoolDOFactory.buildWithId({
					systems: [sourceSystemId],
					oauthMigrationMandatory: migrationMandatoryDate,
					oauthMigrationStart: migrationStartDate,
					oauthMigrationFinished: migrationClosedDate,
					oauthMigrationFinalFinish: migrationFinishDate,
				});

				const sanisSystemId = 'sanisSystemId';
				const sanisSystem: SystemDto = new SystemDto({
					id: sanisSystemId,
					type: 'oauth',
					alias: 'SANIS',
				});

				userService.findById.mockResolvedValue(user);
				schoolService.getSchoolById.mockResolvedValue(school);
				systemService.findByType.mockResolvedValue([sanisSystem]);

				return {
					userId,
					sanisSystemId,
					school,
					migrationMandatoryDate,
					migrationStartDate,
					migrationClosedDate,
					migrationFinishDate,
					sourceSystemId,
				};
			};

			describe('when the school has a system', () => {
				it('should return the users migration with a source system', async () => {
					const {
						userId,
						sanisSystemId,
						sourceSystemId,
						migrationStartDate,
						migrationClosedDate,
						migrationFinishDate,
						migrationMandatoryDate,
					} = setup();

					const result: Page<UserLoginMigrationDO> = await service.findUserLoginMigrations({ userId }, {});

					expect(result).toEqual<Page<UserLoginMigrationDO>>({
						data: [
							{
								sourceSystemId,
								targetSystemId: sanisSystemId,
								startedAt: migrationStartDate,
								closedAt: migrationClosedDate,
								finishedAt: migrationFinishDate,
								mandatorySince: migrationMandatoryDate,
							},
						],
						total: 1,
					});
				});
			});

			describe('when the school has no system', () => {
				it('should return the users migration without a source system', async () => {
					const {
						userId,
						sanisSystemId,
						migrationStartDate,
						migrationClosedDate,
						migrationFinishDate,
						migrationMandatoryDate,
						school,
					} = setup();
					school.systems = [];

					const result: Page<UserLoginMigrationDO> = await service.findUserLoginMigrations({ userId }, {});

					expect(result).toEqual<Page<UserLoginMigrationDO>>({
						data: [
							{
								targetSystemId: sanisSystemId,
								startedAt: migrationStartDate,
								closedAt: migrationClosedDate,
								finishedAt: migrationFinishDate,
								mandatorySince: migrationMandatoryDate,
							},
						],
						total: 1,
					});
				});
			});
		});

		describe('when using a query with user id and the users school is in migration, but the user has already migrated', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const user: UserDO = userDoFactory.buildWithId({ lastLoginSystemChange: new Date('2023-04-06') }, userId);

				const migrationStartDate: Date = new Date('2023-04-05');
				const school: SchoolDO = schoolDOFactory.buildWithId({
					systems: [],
					oauthMigrationStart: migrationStartDate,
				});

				const sanisSystemId = 'sanisSystemId';
				const sanisSystem: SystemDto = new SystemDto({
					id: sanisSystemId,
					type: 'oauth',
					alias: 'SANIS',
				});

				userService.findById.mockResolvedValue(user);
				schoolService.getSchoolById.mockResolvedValue(school);
				systemService.findByType.mockResolvedValue([sanisSystem]);

				return {
					userId,
					sanisSystemId,
					school,
					migrationStartDate,
				};
			};

			describe('when the school has a system', () => {
				it('should return an empty array', async () => {
					const { userId } = setup();

					const result: Page<UserLoginMigrationDO> = await service.findUserLoginMigrations({ userId }, {});

					expect(result).toEqual<Page<UserLoginMigrationDO>>({
						data: [],
						total: 0,
					});
				});
			});
		});

		describe('when using a query with user id and there is no migration for the user', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const user: UserDO = userDoFactory.buildWithId(undefined, userId);

				const school: SchoolDO = schoolDOFactory.buildWithId({ oauthMigrationStart: undefined });

				userService.findById.mockResolvedValue(user);
				schoolService.getSchoolById.mockResolvedValue(school);

				return {
					userId,
				};
			};

			it('should return an empty array', async () => {
				const { userId } = setup();

				const result: Page<UserLoginMigrationDO> = await service.findUserLoginMigrations({ userId }, {});

				expect(result).toEqual<Page<UserLoginMigrationDO>>({
					data: [],
					total: 0,
				});
			});
		});

		describe('when not using a query with user id', () => {
			it('should return an empty array', async () => {
				const result: Page<UserLoginMigrationDO> = await service.findUserLoginMigrations({}, {});

				expect(result).toEqual<Page<UserLoginMigrationDO>>({
					data: [],
					total: 0,
				});
			});
		});

		describe('when SANIS is not a system', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const user: UserDO = userDoFactory.buildWithId(undefined, userId);

				const sourceSystemId = 'sourceSystemId';
				const migrationStartDate: Date = new Date();
				const school: SchoolDO = schoolDOFactory.buildWithId({
					systems: [sourceSystemId],
					oauthMigrationStart: migrationStartDate,
				});

				userService.findById.mockResolvedValue(user);
				schoolService.getSchoolById.mockResolvedValue(school);
				systemService.findByType.mockResolvedValue([]);

				return {
					userId,
				};
			};

			it('should throw an InternalServerErrorException', async () => {
				const { userId } = setup();

				const func = async () => service.findUserLoginMigrations({ userId }, {});

				await expect(func).rejects.toThrow(new InternalServerErrorException('Cannot find Sanis system information.'));
			});
		});
	});

	const setupMigration = (possible?: boolean, mandatory?: boolean, finished?: boolean) => {
		const testId = 'migration';
		const testDO = new SchoolDO({
			id: testId,
			name: 'testDO',
			oauthMigrationPossible: possible ? new Date() : undefined,
			oauthMigrationMandatory: mandatory ? new Date() : undefined,
			oauthMigrationFinished: finished ? new Date() : undefined,
			officialSchoolNumber: '1337',
		});

		if (testDO.oauthMigrationFinished) {
			testDO.oauthMigrationFinalFinish = new Date(
				testDO.oauthMigrationFinished.getTime() + (Configuration.get('MIGRATION_END_GRACE_PERIOD_MS') as number)
			);
		}

		schoolRepo.findById.mockResolvedValue(testDO);
		schoolRepo.save.mockResolvedValue(testDO);

		return { testId, testDO };
	};

	describe('setMigration is called', () => {
		describe('when migrationflags are truthy', () => {
			it('should set the migrationflags', async () => {
				const { testId, testDO } = setupMigration(true, true, true);

				const resp: MigrationResponse = await schoolService.setMigration(testId, true, true, true);

				expect(resp).toEqual<MigrationResponse>({
					oauthMigrationPossible: testDO.oauthMigrationPossible,
					oauthMigrationMandatory: testDO.oauthMigrationMandatory,
					oauthMigrationFinished: testDO.oauthMigrationFinished,
					oauthMigrationFinalFinish: testDO.oauthMigrationFinalFinish,
					enableMigrationStart: true,
				});
			});

			it('should call findById with the given id', async () => {
				const { testId } = setupMigration(true, true, true);

				await schoolService.setMigration(testId, true, true, true);

				expect(schoolRepo.findById).toHaveBeenCalledWith(testId);
			});

			it('should save the DO', async () => {
				const { testId, testDO } = setupMigration(true, true, true);

				await schoolService.setMigration(testId, true, true, true);

				expect(schoolRepo.save).toHaveBeenCalledWith(testDO);
			});

			describe('when the school has a feature', () => {
				it('should add the OAUTH_PROVISIONING_ENABLED feature to the schools feature list', async () => {
					const { testId, testDO } = setupMigration(true);
					const existingFeature: SchoolFeatures = 'otherFeature' as SchoolFeatures;
					testDO.features = [existingFeature];

					await schoolService.setMigration(testId, true, undefined, undefined);

					expect(schoolRepo.save).toHaveBeenCalledWith(
						expect.objectContaining<Partial<SchoolDO>>({
							features: [existingFeature, SchoolFeatures.OAUTH_PROVISIONING_ENABLED],
						})
					);
				});
			});

			describe('when the school has no features yet', () => {
				it('should set the OAUTH_PROVISIONING_ENABLED feature for the school', async () => {
					const { testId } = setupMigration(true);

					await schoolService.setMigration(testId, true, undefined, undefined);

					expect(schoolRepo.save).toHaveBeenCalledWith(
						expect.objectContaining<Partial<SchoolDO>>({
							features: [SchoolFeatures.OAUTH_PROVISIONING_ENABLED],
						})
					);
				});
			});
		});

		describe('when oauthMigrationPossible is undefined', () => {
			it('should set oauthMigrationPossible to undefined', async () => {
				const { testId, testDO } = setupMigration(undefined, true, true);

				const resp: MigrationResponse = await schoolService.setMigration(testId, undefined, true, true);

				expect(resp).toEqual<MigrationResponse>({
					oauthMigrationPossible: testDO.oauthMigrationPossible,
					oauthMigrationMandatory: testDO.oauthMigrationMandatory,
					oauthMigrationFinished: testDO.oauthMigrationFinished,
					oauthMigrationFinalFinish: testDO.oauthMigrationFinalFinish,
					enableMigrationStart: true,
				});
			});
		});

		describe('when oauthMigrationMandatory is undefined', () => {
			it('should set oauthMigrationMandatory to undefined', async () => {
				const { testId, testDO } = setupMigration(true, undefined, true);

				const resp: MigrationResponse = await schoolService.setMigration(testId, true, undefined, true);

				expect(resp).toEqual<MigrationResponse>({
					oauthMigrationPossible: testDO.oauthMigrationPossible,
					oauthMigrationMandatory: testDO.oauthMigrationMandatory,
					oauthMigrationFinished: testDO.oauthMigrationFinished,
					oauthMigrationFinalFinish: testDO.oauthMigrationFinalFinish,
					enableMigrationStart: true,
				});
			});
		});

		describe('when oauthMigrationFinished is undefined', () => {
			it('should set oauthMigrationFinished to undefined', async () => {
				const { testId, testDO } = setupMigration(true, true, undefined);

				const resp: MigrationResponse = await schoolService.setMigration(testId, true, true, undefined);

				expect(resp).toEqual<MigrationResponse>({
					oauthMigrationPossible: testDO.oauthMigrationPossible,
					oauthMigrationMandatory: testDO.oauthMigrationMandatory,
					oauthMigrationFinished: testDO.oauthMigrationFinished,
					oauthMigrationFinalFinish: testDO.oauthMigrationFinalFinish,
					enableMigrationStart: true,
				});
			});
		});

		describe('when DO does not have oauthMigrationPossible and oauthMigrationFinished', () => {
			it('should set oauthMigrationStart', async () => {
				const { testId, testDO } = setupMigration(undefined, undefined, undefined);

				const resp: MigrationResponse = await schoolService.setMigration(testId, true, true, undefined);

				expect(resp.oauthMigrationPossible).toEqual(testDO.oauthMigrationPossible);
				expect(resp.oauthMigrationMandatory).toEqual(testDO.oauthMigrationMandatory);
				expect(resp.oauthMigrationFinished).toEqual(testDO.oauthMigrationFinished);
				expect(resp.oauthMigrationFinalFinish).toEqual(testDO.oauthMigrationFinalFinish);
				expect(testDO.oauthMigrationStart).toBeTruthy();
				expect(resp.enableMigrationStart).toBeTruthy();
			});
		});

		describe('when oauthMigrationFinished is false', () => {
			it('should set oauthMigrationStart', async () => {
				const { testId, testDO } = setupMigration(true, true, true);

				const resp: MigrationResponse = await schoolService.setMigration(testId, true, true, false);

				expect(resp.oauthMigrationPossible).toEqual(testDO.oauthMigrationPossible);
				expect(resp.oauthMigrationMandatory).toEqual(testDO.oauthMigrationMandatory);
				expect(resp.oauthMigrationFinished).toEqual(testDO.oauthMigrationFinished);
				expect(resp.oauthMigrationFinalFinish).toEqual(undefined);
			});
		});

		describe('when migrationflags are falsly', () => {
			it('should not set the migrationflags', async () => {
				const { testId, testDO } = setupMigration(false, false, false);

				const resp: MigrationResponse = await schoolService.setMigration(testId, false, false, false);

				expect(resp).toEqual<MigrationResponse>({
					oauthMigrationPossible: testDO.oauthMigrationPossible,
					oauthMigrationMandatory: testDO.oauthMigrationMandatory,
					oauthMigrationFinished: testDO.oauthMigrationFinished,
					oauthMigrationFinalFinish: testDO.oauthMigrationFinalFinish,
					enableMigrationStart: true,
				});
			});

			it('should call findById with the given id', async () => {
				const { testId } = setupMigration(false, false, false);

				await schoolService.setMigration(testId, false, false, false);

				expect(schoolRepo.findById).toHaveBeenCalledWith(testId);
			});

			it('should save the DO', async () => {
				const { testId, testDO } = setupMigration(false, false, false);

				await schoolService.setMigration(testId, false, false, false);

				expect(schoolRepo.save).toHaveBeenCalledWith(testDO);
			});
		});
	});

	describe('getMigration is called', () => {
		let testId: string;
		let testDO: SchoolDO;
		beforeEach(() => {
			testId = 'migration';
			testDO = new SchoolDO({
				id: testId,
				name: 'testDO',
				oauthMigrationPossible: new Date(),
				oauthMigrationMandatory: new Date(),
				oauthMigrationFinished: new Date(),
				officialSchoolNumber: '1337',
			});
			schoolRepo.findById.mockResolvedValue(testDO);
		});

		describe('when migrationflags and officialSchoolNumber are set and schoolId is given', () => {
			it('should get the migrationflags', async () => {
				const resp: OauthMigrationDto = await schoolService.getMigration(testId);

				expect(resp.oauthMigrationPossible).toEqual(testDO.oauthMigrationPossible);
				expect(resp.oauthMigrationMandatory).toEqual(testDO.oauthMigrationMandatory);
				expect(resp.oauthMigrationFinished).toEqual(testDO.oauthMigrationFinished);
				expect(resp.enableMigrationStart).toBeTruthy();
			});
		});

		describe('when migrationflags and officialSchoolNumber are not set and schoolId is given', () => {
			it('should get the migrationflags when not set', async () => {
				testDO.oauthMigrationPossible = undefined;
				testDO.oauthMigrationMandatory = undefined;
				testDO.oauthMigrationFinished = undefined;
				testDO.officialSchoolNumber = undefined;

				const resp: OauthMigrationDto = await schoolService.getMigration(testId);

				expect(resp.oauthMigrationPossible).toBeUndefined();
				expect(resp.oauthMigrationMandatory).toBeUndefined();
				expect(resp.oauthMigrationFinished).toBeUndefined();
				expect(resp.enableMigrationStart).toBeFalsy();
			});
		});

		describe('when no schoolDO is found', () => {
			it('should throw an Exception', async () => {
				schoolRepo.findById.mockRejectedValue(new EntityNotFoundError('School'));

				const resp: Promise<OauthMigrationDto> = schoolService.getMigration('undefined');

				await expect(resp).rejects.toThrow(EntityNotFoundError);
			});
		});
	});
});
