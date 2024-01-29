import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { UserService } from '@modules/user';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacySchoolDo } from '@shared/domain/domainobject';
import { ImportUser, MatchCreator, SchoolEntity, SystemEntity, User } from '@shared/domain/entity';
import { SchoolFeature } from '@shared/domain/types';
import { ImportUserRepo, LegacySystemRepo } from '@shared/repo';
import {
	cleanupCollections,
	importUserFactory,
	legacySchoolDoFactory,
	schoolEntityFactory,
	setupEntities,
	systemEntityFactory,
	userFactory,
} from '@shared/testing';
import { Logger } from '@src/core/logger';
import { IUserImportFeatures, UserImportFeatures } from '../config';
import { UserMigrationIsNotEnabled } from '../loggable';
import { UserImportService } from './user-import.service';

describe(UserImportService.name, () => {
	let module: TestingModule;
	let service: UserImportService;
	let em: EntityManager;

	let importUserRepo: DeepMocked<ImportUserRepo>;
	let legacySystemRepo: DeepMocked<LegacySystemRepo>;
	let userService: DeepMocked<UserService>;
	let logger: DeepMocked<Logger>;

	const features: IUserImportFeatures = {
		userMigrationSystemId: new ObjectId().toHexString(),
		userMigrationEnabled: true,
		instance: 'n21',
	};

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				UserImportService,
				{
					provide: ImportUserRepo,
					useValue: createMock<ImportUserRepo>(),
				},
				{
					provide: LegacySystemRepo,
					useValue: createMock<LegacySystemRepo>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: UserImportFeatures,
					useValue: features,
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(UserImportService);
		em = module.get(EntityManager);
		importUserRepo = module.get(ImportUserRepo);
		legacySystemRepo = module.get(LegacySystemRepo);
		userService = module.get(UserService);
		logger = module.get(Logger);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	describe('saveImportUsers', () => {
		describe('when saving import users', () => {
			const setup = () => {
				const importUser: ImportUser = importUserFactory.build();
				const otherImportUser: ImportUser = importUserFactory.build();

				return {
					importUsers: [importUser, otherImportUser],
				};
			};

			it('should call saveImportUsers', async () => {
				const { importUsers } = setup();

				await service.saveImportUsers(importUsers);

				expect(importUserRepo.saveImportUsers).toHaveBeenCalledWith(importUsers);
			});
		});
	});

	describe('getMigrationSystem', () => {
		describe('when fetching the migration system', () => {
			const setup = () => {
				const system: SystemEntity = systemEntityFactory.buildWithId(undefined, features.userMigrationSystemId);

				legacySystemRepo.findById.mockResolvedValueOnce(system);

				return {
					system,
				};
			};

			it('should return the system', async () => {
				const { system } = setup();

				const result: SystemEntity = await service.getMigrationSystem();

				expect(result).toEqual(system);
			});
		});
	});

	describe('checkFeatureEnabled', () => {
		describe('when the global feature is enabled', () => {
			const setup = () => {
				features.userMigrationEnabled = true;

				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId({ features: undefined });

				return {
					school,
				};
			};

			it('should do nothing', () => {
				const { school } = setup();

				service.checkFeatureEnabled(school);
			});
		});

		describe('when the school feature is enabled', () => {
			const setup = () => {
				features.userMigrationEnabled = false;

				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId({
					features: [SchoolFeature.LDAP_UNIVENTION_MIGRATION],
				});

				return {
					school,
				};
			};

			it('should do nothing', () => {
				const { school } = setup();

				service.checkFeatureEnabled(school);
			});
		});

		describe('when the features are disabled', () => {
			const setup = () => {
				features.userMigrationEnabled = false;

				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId({
					features: [],
				});

				return {
					school,
				};
			};

			it('should do nothing', () => {
				const { school } = setup();

				expect(() => service.checkFeatureEnabled(school)).toThrow(
					new InternalServerErrorException('User Migration not enabled')
				);
			});

			it('should log a warning', () => {
				const { school } = setup();

				expect(() => service.checkFeatureEnabled(school)).toThrow(
					new InternalServerErrorException('User Migration not enabled')
				);
				expect(logger.warning).toHaveBeenCalledWith(new UserMigrationIsNotEnabled());
			});
		});

		describe('matchUsers', () => {
			describe('when all users have unique names', () => {
				const setup = () => {
					const school: SchoolEntity = schoolEntityFactory.buildWithId();
					const user1: User = userFactory.buildWithId({ firstName: 'First1', lastName: 'Last1' });
					const user2: User = userFactory.buildWithId({ firstName: 'First2', lastName: 'Last2' });
					const importUser1: ImportUser = importUserFactory.buildWithId({
						school,
						firstName: user1.firstName,
						lastName: user1.lastName,
					});
					const importUser2: ImportUser = importUserFactory.buildWithId({
						school,
						firstName: user2.firstName,
						lastName: user2.lastName,
					});

					userService.findUserBySchoolAndName.mockResolvedValueOnce([user1]);
					userService.findUserBySchoolAndName.mockResolvedValueOnce([user2]);

					return {
						user1,
						user2,
						importUser1,
						importUser2,
					};
				};

				it('should return all users as auto matched', async () => {
					const { user1, user2, importUser1, importUser2 } = setup();

					const result: ImportUser[] = await service.matchUsers([importUser1, importUser2]);

					expect(result).toEqual([
						{ ...importUser1, user: user1, matchedBy: MatchCreator.AUTO },
						{ ...importUser2, user: user2, matchedBy: MatchCreator.AUTO },
					]);
				});
			});

			describe('when the imported users have the same names', () => {
				const setup = () => {
					const school: SchoolEntity = schoolEntityFactory.buildWithId();
					const user1: User = userFactory.buildWithId({ firstName: 'First', lastName: 'Last' });
					const importUser1: ImportUser = importUserFactory.buildWithId({
						school,
						firstName: user1.firstName,
						lastName: user1.lastName,
					});
					const importUser2: ImportUser = importUserFactory.buildWithId({
						school,
						firstName: user1.firstName,
						lastName: user1.lastName,
					});

					userService.findUserBySchoolAndName.mockResolvedValueOnce([user1]);
					userService.findUserBySchoolAndName.mockResolvedValueOnce([user1]);

					return {
						user1,
						importUser1,
						importUser2,
					};
				};

				it('should return the users without a match', async () => {
					const { importUser1, importUser2 } = setup();

					const result: ImportUser[] = await service.matchUsers([importUser1, importUser2]);

					expect(result).toEqual([importUser1, importUser2]);
				});
			});

			describe('when existing users have the same names', () => {
				const setup = () => {
					const school: SchoolEntity = schoolEntityFactory.buildWithId();
					const user1: User = userFactory.buildWithId({ firstName: 'First', lastName: 'Last' });
					const user2: User = userFactory.buildWithId({ firstName: 'First', lastName: 'Last' });
					const importUser1: ImportUser = importUserFactory.buildWithId({
						school,
						firstName: user1.firstName,
						lastName: user1.lastName,
					});

					userService.findUserBySchoolAndName.mockResolvedValueOnce([user1, user2]);
					userService.findUserBySchoolAndName.mockResolvedValueOnce([user1, user2]);

					return {
						user1,
						user2,
						importUser1,
					};
				};

				it('should return the users without a match', async () => {
					const { importUser1 } = setup();

					const result: ImportUser[] = await service.matchUsers([importUser1]);

					expect(result).toEqual([importUser1]);
				});
			});
		});
	});
});
