import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, type TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { BoardImportJobStatus, BoardImportJobUnreadableError } from '../../domain';
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
				const boardId = new ObjectId().toHexString();
				const job = boardImportJobFactory.build({ attempts: 2, startedAt: new Date(), boardId });

				return { job, boardId };
			};

			it('should store the job', async () => {
				const { job, boardId } = setup();

				await repo.save(job);
				em.clear();

				const entity = await em.findOneOrFail(BoardImportJobEntity, { id: job.id });
				expect(entity).toMatchObject({
					id: job.id,
					status: job.status,
					userId: new ObjectId(job.userId),
					link: job.link,
					targetType: job.target.type,
					targetId: new ObjectId(job.target.id),
					expiresAt: job.expiresAt,
					attempts: job.attempts,
					startedAt: job.startedAt,
					boardId: new ObjectId(boardId),
				});
			});
		});
	});

	describe('findById', () => {
		describe('when the job exists', () => {
			const setup = async () => {
				const boardId = new ObjectId();
				const entity = boardImportJobEntityFactory.build({ attempts: 2, startedAt: new Date(), boardId });
				await em.persist(entity).flush();
				em.clear();

				const expectedProps = {
					id: entity.id,
					status: entity.status,
					userId: entity.userId.toHexString(),
					link: entity.link,
					target: { type: entity.targetType, id: entity.targetId.toHexString() },
					expiresAt: entity.expiresAt,
					attempts: entity.attempts,
					startedAt: entity.startedAt,
					boardId: boardId.toHexString(),
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

		describe('when the stored job has no target', () => {
			const setup = async () => {
				const entity = boardImportJobEntityFactory.build();
				await em.persist(entity).flush();
				await em
					.getCollection(BoardImportJobEntity)
					.updateOne({ _id: new ObjectId(entity.id) }, { $unset: { targetType: '', targetId: '' } });
				em.clear();

				return { id: entity.id };
			};

			it('should throw an unreadable error', async () => {
				const { id } = await setup();

				await expect(repo.findById(id)).rejects.toThrow(BoardImportJobUnreadableError);
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

	describe('closeAttempt', () => {
		describe.each([BoardImportJobStatus.FINISHED, BoardImportJobStatus.FAILED] as const)(
			'when the job is running in the given attempt and gets the status %s',
			(status) => {
				const setup = async () => {
					const entity = boardImportJobEntityFactory.build({ status: BoardImportJobStatus.RUNNING, attempts: 2 });
					const updatedAt = new Date('2026-01-01T00:00:00.000Z');
					entity.updatedAt = updatedAt;
					await em.persist(entity).flush();
					em.clear();

					return { id: entity.id, attempts: entity.attempts, updatedAt };
				};

				it('should store the status and return true', async () => {
					const { id, attempts } = await setup();

					const result = await repo.closeAttempt(id, attempts, status);

					const entity = await em.findOneOrFail(BoardImportJobEntity, { id });
					expect(result).toEqual(true);
					expect(entity).toMatchObject({ status, attempts });
				});

				it('should update the change date', async () => {
					const { id, attempts, updatedAt } = await setup();

					await repo.closeAttempt(id, attempts, status);

					const entity = await em.findOneOrFail(BoardImportJobEntity, { id });
					expect(entity.updatedAt.getTime()).toBeGreaterThan(updatedAt.getTime());
				});
			}
		);

		describe('when the job is running in a later attempt', () => {
			const setup = async () => {
				const entity = boardImportJobEntityFactory.build({ status: BoardImportJobStatus.RUNNING, attempts: 2 });
				await em.persist(entity).flush();
				em.clear();
				const outdatedAttempts = entity.attempts - 1;

				return { id: entity.id, attempts: entity.attempts, status: entity.status, outdatedAttempts };
			};

			it('should not change the job and return false', async () => {
				const { id, attempts, status, outdatedAttempts } = await setup();

				const result = await repo.closeAttempt(id, outdatedAttempts, BoardImportJobStatus.FINISHED);

				const entity = await em.findOneOrFail(BoardImportJobEntity, { id });
				expect(result).toEqual(false);
				expect(entity).toMatchObject({ status, attempts });
			});
		});

		describe.each([
			[BoardImportJobStatus.FINISHED, BoardImportJobStatus.FAILED],
			[BoardImportJobStatus.FAILED, BoardImportJobStatus.FINISHED],
		] as const)('when the job already has the end status %s', (status, otherStatus) => {
			const setup = async () => {
				const entity = boardImportJobEntityFactory.build({ status, attempts: 2 });
				await em.persist(entity).flush();
				em.clear();

				return { id: entity.id, attempts: entity.attempts };
			};

			it('should not change the job and return false', async () => {
				const { id, attempts } = await setup();

				const result = await repo.closeAttempt(id, attempts, otherStatus);

				const entity = await em.findOneOrFail(BoardImportJobEntity, { id });
				expect(result).toEqual(false);
				expect(entity.status).toEqual(status);
			});
		});
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

	describe('failIfOpen', () => {
		describe.each([BoardImportJobStatus.WAITING, BoardImportJobStatus.RUNNING])('when the job is %s', (status) => {
			const setup = async () => {
				const entity = boardImportJobEntityFactory.build({ status });
				await em.persist(entity).flush();
				await em
					.getCollection(BoardImportJobEntity)
					.updateOne({ _id: new ObjectId(entity.id) }, { $unset: { targetType: '', targetId: '' } });
				em.clear();
				const expectedStatus = BoardImportJobStatus.FAILED;

				return { id: entity.id, expectedStatus };
			};

			it('should set the job to failed without reading it and return true', async () => {
				const { id, expectedStatus } = await setup();

				const result = await repo.failIfOpen(id);

				const document = await em.getCollection(BoardImportJobEntity).findOne({ _id: new ObjectId(id) });
				expect(result).toEqual(true);
				expect(document?.status).toEqual(expectedStatus);
			});
		});

		describe.each([BoardImportJobStatus.FINISHED, BoardImportJobStatus.FAILED])('when the job is %s', (status) => {
			const setup = async () => {
				const entity = boardImportJobEntityFactory.build({ status });
				await em.persist(entity).flush();
				em.clear();

				return { id: entity.id, status };
			};

			it('should not change the job and return false', async () => {
				const { id, status } = await setup();

				const result = await repo.failIfOpen(id);

				const entity = await em.findOneOrFail(BoardImportJobEntity, { id });
				expect(result).toEqual(false);
				expect(entity.status).toEqual(status);
			});
		});
	});

	describe('setBoardId', () => {
		describe('when the job exists', () => {
			const setup = async () => {
				const entity = boardImportJobEntityFactory.build();
				await em.persist(entity).flush();
				em.clear();
				const boardId = new ObjectId().toHexString();

				return { id: entity.id, boardId };
			};

			it('should store the board', async () => {
				const { id, boardId } = await setup();

				await repo.setBoardId(id, boardId);

				const job = await repo.findById(id);
				expect(job?.boardId).toEqual(boardId);
			});
		});
	});

	describe('removeBoardId', () => {
		describe('when the job has a board', () => {
			const setup = async () => {
				const entity = boardImportJobEntityFactory.build({ boardId: new ObjectId() });
				await em.persist(entity).flush();
				em.clear();

				return { id: entity.id };
			};

			it('should remove the board from the job', async () => {
				const { id } = await setup();

				await repo.removeBoardId(id);

				const job = await repo.findById(id);
				expect(job?.boardId).toBeUndefined();
			});
		});
	});
});
