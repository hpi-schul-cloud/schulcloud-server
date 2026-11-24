import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, type TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { boardImportJobEntityFactory, boardImportJobFactory } from '../../testing';
import { BoardImportJobEntity } from '../entity';
import { BoardImportJobMikroOrmRepo } from './board-import-job.repo';

describe(BoardImportJobMikroOrmRepo.name, () => {
	let module: TestingModule;
	let em: EntityManager;
	let repo: BoardImportJobMikroOrmRepo;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [BoardImportJobEntity] })],
			providers: [BoardImportJobMikroOrmRepo],
		}).compile();

		em = module.get(EntityManager);
		repo = module.get(BoardImportJobMikroOrmRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('save', () => {
		describe('when the job is new', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();

				return { job };
			};

			it('should store the job', async () => {
				const { job } = setup();

				await repo.save(job);
				em.clear();

				const entity = await em.findOneOrFail(BoardImportJobEntity, { id: job.id });
				expect(entity).toMatchObject({
					id: job.id,
					status: job.status,
					userId: new ObjectId(job.userId),
					link: job.link,
					expiresAt: job.expiresAt,
				});
			});
		});
	});

	describe('findById', () => {
		describe('when the job exists', () => {
			const setup = async () => {
				const entity = boardImportJobEntityFactory.build();
				await em.persist(entity).flush();
				em.clear();

				const expectedProps = {
					id: entity.id,
					status: entity.status,
					userId: entity.userId.toHexString(),
					link: entity.link,
					expiresAt: entity.expiresAt,
				};

				return { expectedProps };
			};

			it('should return the job', async () => {
				const { expectedProps } = await setup();

				const job = await repo.findById(expectedProps.id);

				expect(job?.getProps()).toEqual(expectedProps);
			});
		});

		describe('when the job does not exist', () => {
			const setup = () => {
				const id = new ObjectId().toHexString();

				return { id };
			};

			it('should return null', async () => {
				const { id } = setup();

				const job = await repo.findById(id);

				expect(job).toBeNull();
			});
		});
	});
});
