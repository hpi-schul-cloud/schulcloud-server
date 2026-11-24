import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, type TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { BoardImportJobStatus } from '../../domain';
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
				const job = boardImportJobFactory.build({ attempts: 2, startedAt: new Date() });

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
					attempts: job.attempts,
					startedAt: job.startedAt,
				});
			});
		});
	});

	describe('findById', () => {
		describe('when the job exists', () => {
			const setup = async () => {
				const entity = boardImportJobEntityFactory.build({ attempts: 2, startedAt: new Date() });
				await em.persist(entity).flush();
				em.clear();

				const expectedProps = {
					id: entity.id,
					status: entity.status,
					userId: entity.userId.toHexString(),
					link: entity.link,
					expiresAt: entity.expiresAt,
					attempts: entity.attempts,
					startedAt: entity.startedAt,
				};

				return { expectedProps };
			};

			it('should return the job', async () => {
				const { expectedProps } = await setup();

				const job = await repo.findById(expectedProps.id);

				expect(job?.getProps()).toEqual(expectedProps);
			});
		});

		describe('when the stored job has no attempt counter', () => {
			const setup = async () => {
				const entity = boardImportJobEntityFactory.build();
				await em.persist(entity).flush();
				await em
					.getCollection(BoardImportJobEntity)
					.updateOne({ _id: new ObjectId(entity.id) }, { $unset: { attempts: '' } });
				em.clear();
				const attempts = 0;

				return { id: entity.id, attempts };
			};

			it('should return a job with zero attempts', async () => {
				const { id, attempts } = await setup();

				const job = await repo.findById(id);

				expect(job?.attempts).toEqual(attempts);
			});
		});

		describe('when the job is loaded and then changed in the database', () => {
			const setup = async () => {
				const entity = boardImportJobEntityFactory.build();
				await em.persist(entity).flush();
				const status = BoardImportJobStatus.RUNNING;
				await em.getCollection(BoardImportJobEntity).updateOne({ _id: new ObjectId(entity.id) }, { $set: { status } });

				return { id: entity.id, status };
			};

			it('should return the stored status', async () => {
				const { id, status } = await setup();

				const job = await repo.findById(id);

				expect(job?.status).toEqual(status);
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

	describe('startAttempt', () => {
		describe('when the job is waiting', () => {
			const setup = async () => {
				const entity = boardImportJobEntityFactory.build();
				await em.persist(entity).flush();
				em.clear();
				const now = new Date('2026-01-01T00:00:00.000Z');
				const status = BoardImportJobStatus.RUNNING;
				const attempts = 1;

				return { id: entity.id, now, status, attempts };
			};

			it('should return the running job with one attempt and the start time', async () => {
				const { id, now, status, attempts } = await setup();

				const job = await repo.startAttempt(id, now);

				expect(job?.getProps()).toMatchObject({ id, status, attempts, startedAt: now });
			});

			it('should store the change', async () => {
				const { id, now, status, attempts } = await setup();

				await repo.startAttempt(id, now);
				em.clear();

				const entity = await em.findOneOrFail(BoardImportJobEntity, { id });
				expect(entity).toMatchObject({ status, attempts, startedAt: now });
			});
		});

		describe('when the job is running', () => {
			const setup = async () => {
				const startedAt = new Date('2026-01-01T00:00:00.000Z');
				const attempts = 1;
				const entity = boardImportJobEntityFactory.build({
					status: BoardImportJobStatus.RUNNING,
					attempts,
					startedAt,
				});
				await em.persist(entity).flush();
				em.clear();
				const now = new Date('2026-01-01T00:05:00.000Z');

				return { id: entity.id, now, startedAt, attempts };
			};

			it('should count the attempt and keep the start time', async () => {
				const { id, now, startedAt, attempts } = await setup();

				const job = await repo.startAttempt(id, now);

				expect(job?.attempts).toEqual(attempts + 1);
				expect(job?.startedAt).toEqual(startedAt);
			});
		});

		describe('when the stored job has no attempt counter', () => {
			const setup = async () => {
				const entity = boardImportJobEntityFactory.build();
				await em.persist(entity).flush();
				await em
					.getCollection(BoardImportJobEntity)
					.updateOne({ _id: new ObjectId(entity.id) }, { $unset: { attempts: '' } });
				em.clear();
				const attempts = 1;

				return { id: entity.id, attempts };
			};

			it('should return a job with one attempt', async () => {
				const { id, attempts } = await setup();

				const job = await repo.startAttempt(id, new Date());

				expect(job?.attempts).toEqual(attempts);
			});
		});

		describe.each([BoardImportJobStatus.FINISHED, BoardImportJobStatus.FAILED])(
			'when the job has the end status %s',
			(status) => {
				const setup = async () => {
					const entity = boardImportJobEntityFactory.build({ status });
					await em.persist(entity).flush();
					em.clear();

					return { id: entity.id, attempts: entity.attempts };
				};

				it('should return null and not change the job', async () => {
					const { id, attempts } = await setup();

					const job = await repo.startAttempt(id, new Date());

					const entity = await em.findOneOrFail(BoardImportJobEntity, { id });
					expect(job).toBeNull();
					expect(entity).toMatchObject({ status, attempts });
				});
			}
		);
	});

	describe('failIfWaiting', () => {
		describe('when the job is waiting', () => {
			const setup = async () => {
				const entity = boardImportJobEntityFactory.build();
				const updatedAt = new Date('2026-01-01T00:00:00.000Z');
				entity.updatedAt = updatedAt;
				await em.persist(entity).flush();
				em.clear();
				const status = BoardImportJobStatus.FAILED;

				return { id: entity.id, status, updatedAt };
			};

			it('should set the job to failed and return true', async () => {
				const { id, status } = await setup();

				const result = await repo.failIfWaiting(id);

				const entity = await em.findOneOrFail(BoardImportJobEntity, { id });
				expect(result).toEqual(true);
				expect(entity.status).toEqual(status);
			});

			it('should update the change date', async () => {
				const { id, updatedAt } = await setup();

				await repo.failIfWaiting(id);

				const entity = await em.findOneOrFail(BoardImportJobEntity, { id });
				expect(entity.updatedAt.getTime()).toBeGreaterThan(updatedAt.getTime());
			});
		});

		describe('when a worker took the job', () => {
			const setup = async () => {
				const status = BoardImportJobStatus.RUNNING;
				const entity = boardImportJobEntityFactory.build({ status });
				await em.persist(entity).flush();
				em.clear();

				return { id: entity.id, status };
			};

			it('should not change the job and return false', async () => {
				const { id, status } = await setup();

				const result = await repo.failIfWaiting(id);

				const entity = await em.findOneOrFail(BoardImportJobEntity, { id });
				expect(result).toEqual(false);
				expect(entity.status).toEqual(status);
			});
		});
	});
});
