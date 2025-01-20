import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager } from '@mikro-orm/mongodb';
import { SystemType } from '@modules/system';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolEntity } from '@shared/domain/entity';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SchoolFeature } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { cleanupCollections } from '@testing/cleanup-collections';
import { schoolEntityFactory } from '@testing/factory/school-entity.factory';
import { systemEntityFactory } from '@testing/factory/systemEntityFactory';
import { TspLegacyMigrationSystemMissingLoggable } from './loggable/tsp-legacy-migration-system-missing.loggable';
import { TspLegacyMigrationService } from './tsp-legacy-migration.service';

describe('account repo', () => {
	let module: TestingModule;
	let em: EntityManager;
	let sut: TspLegacyMigrationService;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				TspLegacyMigrationService,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();
		sut = module.get(TspLegacyMigrationService);
		em = module.get(EntityManager);
		logger = module.get(Logger);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		jest.resetAllMocks();
		jest.clearAllMocks();
		jest.restoreAllMocks();
		await cleanupCollections(em);
	});

	describe('migrateLegacyData', () => {
		describe('when legacy system is not found', () => {
			it('should log TspLegacyMigrationSystemMissingLoggable', async () => {
				await sut.migrateLegacyData('');

				expect(logger.info).toHaveBeenCalledWith(new TspLegacyMigrationSystemMissingLoggable());
			});
		});

		describe('when migrating legacy data', () => {
			const setup = async () => {
				const legacySystem = systemEntityFactory.buildWithId({
					type: 'tsp-school',
				});
				const newSystem = systemEntityFactory.buildWithId({
					type: SystemType.OAUTH,
					provisioningStrategy: SystemProvisioningStrategy.TSP,
				});

				const schoolIdentifier = '123';
				const legacySchool = schoolEntityFactory.buildWithId({
					systems: [legacySystem],
					features: [],
				});

				await em.persistAndFlush([legacySystem, newSystem, legacySchool]);
				em.clear();

				await em.getCollection('schools').findOneAndUpdate(
					{
						systems: [legacySystem._id],
					},
					{
						$set: {
							sourceOptions: {
								schoolIdentifier,
							},
							source: 'tsp',
						},
					}
				);

				return { legacySystem, newSystem, legacySchool, schoolId: schoolIdentifier };
			};

			it('should update the school to the new format', async () => {
				const { newSystem, legacySchool, schoolId: schoolIdentifier } = await setup();

				await sut.migrateLegacyData(newSystem.id);

				const migratedSchool = await em.findOne<SchoolEntity>(SchoolEntity.name, {
					id: legacySchool.id,
				});
				expect(migratedSchool?.externalId).toBe(schoolIdentifier);
				expect(migratedSchool?.systems[0].id).toBe(newSystem.id);
				expect(migratedSchool?.features).toContain(SchoolFeature.OAUTH_PROVISIONING_ENABLED);
			});
		});
	});
});
