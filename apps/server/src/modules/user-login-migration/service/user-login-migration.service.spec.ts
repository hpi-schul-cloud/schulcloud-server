import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserLoginMigrationDO } from '@shared/domain';
import { Page } from '@shared/domain/domainobject/page';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { userDoFactory } from '@shared/testing';
import { schoolDOFactory } from '@shared/testing/factory/domainobject/school.factory';
import { SchoolService } from '@src/modules/school';
import { SystemService } from '@src/modules/system';
import { SystemDto } from '@src/modules/system/service';
import { UserService } from '@src/modules/user';
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
});
