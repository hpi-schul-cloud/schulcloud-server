import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { School, System, UserLoginMigrationDO } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections, schoolFactory, systemFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { UserLoginMigrationRepo } from './user-login-migration.repo';

describe('UserLoginMigrationRepo', () => {
	let module: TestingModule;
	let repo: UserLoginMigrationRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				UserLoginMigrationRepo,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		repo = module.get(UserLoginMigrationRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('save', () => {
		describe('when saving a UserLoginMigrationDO', () => {
			const setup = async () => {
				const school: School = schoolFactory.buildWithId();
				const sourceSystem: System = systemFactory.buildWithId();
				const targetSystem: System = systemFactory.buildWithId();

				const domainObject: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: school.id,
					sourceSystemId: sourceSystem.id,
					targetSystemId: targetSystem.id,
					mandatorySince: new Date('2023-04-24'),
					startedAt: new Date('2023-04-25'),
					closedAt: new Date('2023-04-26'),
					finishedAt: new Date('2023-04-27'),
				});

				await em.persistAndFlush([school, sourceSystem, targetSystem]);

				return {
					domainObject,
				};
			};

			it('should save a UserLoginMigration to the database', async () => {
				const { domainObject } = await setup();
				const { id, ...expected } = domainObject;

				const result: UserLoginMigrationDO = await repo.save(domainObject);

				expect(result).toMatchObject(expected);
				expect(result.id).toBeDefined();
			});
		});
	});
});
