import { Test, TestingModule } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/core';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { setupEntities, userDoFactory } from '@shared/testing';
import { SchoolService } from '@src/modules/school';
import { UserService } from '@src/modules/user';
import { Logger } from '@src/core/logger';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { Page } from '@shared/domain/interface/page';
import { schoolDOFactory } from '@shared/testing/factory/domainobject/school.factory';
import { SchoolMigrationService } from './school-migration.service';
import { OAuthMigrationError } from '../error/oauth-migration.error';

describe('SchoolMigrationService', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let service: SchoolMigrationService;

	let userService: DeepMocked<UserService>;
	let schoolService: DeepMocked<SchoolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolMigrationService,
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
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

		service = module.get(SchoolMigrationService);
		schoolService = module.get(SchoolService);
		userService = module.get(UserService);

		orm = await setupEntities();
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	const setup = () => {
		const oauthMigrationPossible = new Date(2023, 2, 26);
		const schoolDO: SchoolDO = schoolDOFactory.buildWithId({
			id: 'schoolId',
			name: 'schoolName',
			officialSchoolNumber: '3',
			externalId: 'firstExternalId',
			oauthMigrationFinished: new Date(2023, 2, 27),
			oauthMigrationPossible,
		});

		const userDO: UserDO = {
			id: 'userId',
			schoolId: schoolDO.id as string,
		} as UserDO;
		const targetSystemId = 'targetSystemId';

		return {
			currentUserId: userDO.id as string,
			officialSchoolNumber: schoolDO.officialSchoolNumber,
			schoolDO,
			schoolId: schoolDO.id as string,
			externalId: schoolDO.externalId as string,
			userDO,
			targetSystemId,
			firstExternalId: schoolDO.externalId,
			oauthMigrationPossible,
		};
	};

	describe('schoolToMigrate is called', () => {
		describe('when school number is missing', () => {
			it('should throw an error', async () => {
				const { currentUserId, externalId } = setup();

				const func = () => service.schoolToMigrate(currentUserId, externalId, undefined);

				await expect(func()).rejects.toThrow(
					new OAuthMigrationError(
						'Official school number from target migration system is missing',
						'ext_official_school_number_missing'
					)
				);
			});
		});

		describe('when school could not be found with official school number', () => {
			it('should throw an error', async () => {
				const { currentUserId, externalId, officialSchoolNumber } = setup();
				schoolService.getSchoolBySchoolNumber.mockResolvedValue(null);

				const func = () => service.schoolToMigrate(currentUserId, externalId, officialSchoolNumber);

				await expect(func()).rejects.toThrow(
					new OAuthMigrationError(
						'Could not find school by official school number from target migration system',
						'ext_official_school_number_mismatch'
					)
				);
			});
		});

		describe('when current user is not in the school to migrate to', () => {
			it('should throw an error', async () => {
				const { currentUserId, externalId, schoolDO, userDO } = setup();
				schoolService.getSchoolBySchoolNumber.mockResolvedValue(schoolDO);
				userDO.schoolId = 'anotherSchool';
				userService.findById.mockResolvedValue(userDO);

				const func = () => service.schoolToMigrate(currentUserId, externalId, schoolDO.officialSchoolNumber);

				await expect(func()).rejects.toThrow(
					new OAuthMigrationError(
						'Current users school is not the same as school found by official school number from target migration system',
						'ext_official_school_number_mismatch'
					)
				);
			});
		});

		describe('when school was already migrated', () => {
			it('should return null ', async () => {
				const { currentUserId, externalId, schoolDO, userDO } = setup();
				schoolService.getSchoolBySchoolNumber.mockResolvedValue(schoolDO);
				userService.findById.mockResolvedValue(userDO);

				const result: SchoolDO | null = await service.schoolToMigrate(
					currentUserId,
					externalId,
					schoolDO.officialSchoolNumber
				);

				expect(result).toBeNull();
			});
		});

		describe('when school has to be migrated', () => {
			it('should return migrated school', async () => {
				const { currentUserId, schoolDO, userDO } = setup();
				schoolService.getSchoolBySchoolNumber.mockResolvedValue(schoolDO);
				userService.findById.mockResolvedValue(userDO);

				const result: SchoolDO | null = await service.schoolToMigrate(
					currentUserId,
					'newExternalId',
					schoolDO.officialSchoolNumber
				);

				expect(result).toEqual(schoolDO);
			});
		});
	});

	describe('migrateSchool is called', () => {
		it('should save the migrated school', async () => {
			const { schoolDO, targetSystemId, firstExternalId } = setup();
			const newExternalId = 'newExternalId';

			await service.migrateSchool(newExternalId, schoolDO, targetSystemId);

			expect(schoolService.save).toHaveBeenCalledWith(
				expect.objectContaining<Partial<SchoolDO>>({
					systems: [targetSystemId],
					previousExternalId: firstExternalId,
					externalId: newExternalId,
				})
			);
		});

		describe('when there are other systems before', () => {
			it('should add the system to migrated school', async () => {
				const { schoolDO, targetSystemId } = setup();
				schoolDO.systems = ['existingSystem'];

				await service.migrateSchool('newExternalId', schoolDO, targetSystemId);

				expect(schoolService.save).toHaveBeenCalledWith(
					expect.objectContaining<Partial<SchoolDO>>({
						systems: ['existingSystem', targetSystemId],
					})
				);
			});
		});

		describe('when an error occurred', () => {
			it('should save the old schoolDo (rollback the migration)', async () => {
				const { schoolDO, targetSystemId } = setup();
				schoolService.save.mockRejectedValueOnce(new Error());

				await service.migrateSchool('newExternalId', schoolDO, targetSystemId);

				expect(schoolService.save).toHaveBeenCalledWith(schoolDO);
			});
		});
	});

	describe('completeMigration is called', () => {
		it('should call getSchoolById on schoolService', async () => {
			const expectedSchoolId = 'expectedSchoolId';
			const users: Page<UserDO> = new Page([userDoFactory.buildWithId()], 1);
			userService.findUsers.mockResolvedValue(users);

			await service.completeMigration(expectedSchoolId);

			expect(schoolService.getSchoolById).toHaveBeenCalledWith(expectedSchoolId);
		});

		it('should call findUsers on userService', async () => {
			const { schoolId, oauthMigrationPossible } = setup();
			const users: Page<UserDO> = new Page([userDoFactory.buildWithId()], 1);
			userService.findUsers.mockResolvedValue(users);

			await service.completeMigration(schoolId);

			expect(userService.findUsers).toHaveBeenCalledWith({
				schoolId,
				isOutdated: false,
				lastLoginSystemChangeGreaterThan: expect.objectContaining<Date>(oauthMigrationPossible) as Date,
			});
		});

		it('should save non migrated user', async () => {
			const { schoolDO, userDO, schoolId } = setup();
			const users: Page<UserDO> = new Page([userDO], 1);
			userService.findUsers.mockResolvedValue(users);
			schoolService.getSchoolById.mockResolvedValue(schoolDO);

			await service.completeMigration(schoolId);

			expect(userService.saveAll).toHaveBeenCalledWith(
				expect.arrayContaining<UserDO>([
					{
						...users.data[0],
						outdatedSince: schoolDO.oauthMigrationFinished,
					},
				])
			);
		});
	});
});
