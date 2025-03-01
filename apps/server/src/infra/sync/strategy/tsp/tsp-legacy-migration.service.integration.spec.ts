import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/mongodb';
import { SchoolFeature } from '@modules/school/domain';
import { SchoolEntity } from '@modules/school/repo';
import { schoolEntityFactory } from '@modules/school/testing';
import { SystemType } from '@modules/system';
import { systemEntityFactory } from '@modules/system/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { TspLegacyMigrationSystemMissingLoggable } from './loggable/tsp-legacy-migration-system-missing.loggable';
import { TspLegacyMigrationService } from './tsp-legacy-migration.service';

describe(TspLegacyMigrationService.name, () => {
	let module: TestingModule;
	let em: EntityManager;
	let sut: TspLegacyMigrationService;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [SchoolEntity] })],
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

	describe('prepareLegacySyncDataForNewSync', () => {
		describe('when legacy system is not found', () => {
			it('should log TspLegacyMigrationSystemMissingLoggable', async () => {
				await sut.prepareLegacySyncDataForNewSync('');

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

				await sut.prepareLegacySyncDataForNewSync(newSystem.id);

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
