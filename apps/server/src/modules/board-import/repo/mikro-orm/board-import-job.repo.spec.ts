import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, type TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import {
	type BoardImportCheckpoint,
	BoardImportJobLogReason,
	BoardImportJobRejectedError,
	BoardImportJobStatus,
	BoardImportJobUnreadableError,
	type BoardImportNote,
	BoardImportNoteType,
	IntermediateElementType,
	PlannedElementType,
} from '../../domain';
import { boardImportJobEntityFactory, boardImportJobFactory, boardPlanFactory } from '../../testing';
import { BoardImportJobEntity } from '../entity';
import { BoardImportJobMikroOrmRepo } from './board-import-job.repo';

describe(BoardImportJobMikroOrmRepo.name, () => {
	const newId = (): string => new ObjectId().toHexString();
	const plan = boardPlanFactory.build({
		columns: [
			{
				title: 'Column',
				cards: [{ title: 'Card', elements: [{ type: PlannedElementType.TEXT, html: '<p>Text</p>' }] }],
			},
			{ title: '', cards: [] },
		],
	});

	const runningAttempt = { status: BoardImportJobStatus.RUNNING, attempts: 2 };

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
				const notes: BoardImportNote[] = [
					{ type: BoardImportNoteType.BOARD_TITLE_SHORTENED },
					{
						type: BoardImportNoteType.ELEMENT_LEFT_OUT,
						sectionTitle: 'Section',
						cardTitle: 'Card',
						elementType: IntermediateElementType.NOT_SUPPORTED,
						elementKind: 'contact',
					},
				];
				const checkpoints: BoardImportCheckpoint[] = [
					{ columnId: newId(), cardIds: [newId(), newId()] },
					{ columnId: newId(), cardIds: [] },
				];
				const job = boardImportJobFactory.build({
					attempts: 2,
					startedAt: new Date(),
					boardId,
					notes,
					plan,
					checkpoints,
				});

				return { job, boardId, notes, checkpoints };
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
					link: job.source.link,
					sourceType: job.source.type,
					targetType: job.target.type,
					targetId: new ObjectId(job.target.id),
					expiresAt: job.expiresAt,
					attempts: job.attempts,
					startedAt: job.startedAt,
					boardId: new ObjectId(boardId),
				});
			});

			it('should store the notes of the job', async () => {
				const { job, notes } = setup();

				await repo.save(job);
				em.clear();

				const storedJob = await repo.findById(job.id);
				expect(storedJob?.notes).toEqual(notes);
			});

			it('should store the plan and the checkpoints of the job', async () => {
				const { job, checkpoints } = setup();

				await repo.save(job);
				em.clear();

				const storedJob = await repo.findById(job.id);
				expect(storedJob?.plan).toEqual(plan);
				expect(storedJob?.checkpoints).toEqual(checkpoints);
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
					source: { type: entity.sourceType, link: entity.link },
					target: { type: entity.targetType, id: entity.targetId.toHexString() },
					expiresAt: entity.expiresAt,
					attempts: entity.attempts,
					startedAt: entity.startedAt,
					boardId: boardId.toHexString(),
					notes: [],
					checkpoints: [],
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

		describe('when the job fails with a reason', () => {
			const setup = async () => {
				const entity = boardImportJobEntityFactory.build({ status: BoardImportJobStatus.RUNNING, attempts: 1 });
				await em.persist(entity).flush();
				em.clear();
				const reason = BoardImportJobLogReason.SOURCE_NOT_READABLE;

				return { id: entity.id, attempts: entity.attempts, reason };
			};

			it('should store the reason', async () => {
				const { id, attempts, reason } = await setup();

				await repo.closeAttempt(id, attempts, BoardImportJobStatus.FAILED, reason);

				const job = await repo.findById(id);
				expect(job?.failureReason).toEqual(reason);
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
				const entity = boardImportJobEntityFactory.build(runningAttempt);
				await em.persist(entity).flush();
				em.clear();
				const boardId = new ObjectId().toHexString();

				return { id: entity.id, boardId };
			};

			it('should store the board', async () => {
				const { id, boardId } = await setup();

				await repo.setBoardId(id, runningAttempt.attempts, boardId);

				const job = await repo.findById(id);
				expect(job?.boardId).toEqual(boardId);
			});
		});
	});

	describe('resetBoard', () => {
		describe('when the job has a board with checkpoints', () => {
			const setup = async () => {
				const entity = boardImportJobEntityFactory.build({
					...runningAttempt,
					boardId: new ObjectId(),
					plan,
					checkpoints: [{ columnId: new ObjectId(), cardIds: [new ObjectId()] }],
				});
				await em.persist(entity).flush();
				em.clear();

				return { id: entity.id };
			};

			it('should remove the board and the checkpoints from the job', async () => {
				const { id } = await setup();

				await repo.resetBoard(id, runningAttempt.attempts);

				const job = await repo.findById(id);
				expect(job?.boardId).toBeUndefined();
				expect(job?.checkpoints).toEqual([]);
			});

			it('should keep the plan of the job', async () => {
				const { id } = await setup();

				await repo.resetBoard(id, runningAttempt.attempts);

				const job = await repo.findById(id);
				expect(job?.plan).toEqual(plan);
			});
		});
	});

	describe('setPlan', () => {
		describe('when the job has notes from an attempt before', () => {
			const setup = async () => {
				const entity = boardImportJobEntityFactory.build({
					...runningAttempt,
					notes: [{ type: BoardImportNoteType.BOARD_TITLE_SHORTENED }],
				});
				await em.persist(entity).flush();
				em.clear();
				const notes: BoardImportNote[] = [
					{ type: BoardImportNoteType.BOARD_DESCRIPTION_LEFT_OUT },
					{
						type: BoardImportNoteType.ELEMENT_LEFT_OUT,
						sectionTitle: 'Section',
						cardTitle: '',
						elementType: IntermediateElementType.LINK,
					},
				];

				return { id: entity.id, notes };
			};

			it('should store the plan and replace the notes of the job', async () => {
				const { id, notes } = await setup();

				await repo.setPlan(id, runningAttempt.attempts, plan, notes);
				em.clear();

				const job = await repo.findById(id);
				expect(job?.plan).toEqual(plan);
				expect(job?.notes).toEqual(notes);
			});
		});
	});

	describe('addColumnCheckpoint', () => {
		describe('when the job has a checkpoint', () => {
			const setup = async () => {
				const firstColumnId = new ObjectId();
				const firstCardId = new ObjectId();
				const entity = boardImportJobEntityFactory.build({
					...runningAttempt,
					checkpoints: [{ columnId: firstColumnId, cardIds: [firstCardId] }],
				});
				await em.persist(entity).flush();
				em.clear();
				const columnId = newId();
				const expected: BoardImportCheckpoint[] = [
					{ columnId: firstColumnId.toHexString(), cardIds: [firstCardId.toHexString()] },
					{ columnId, cardIds: [] },
				];

				return { id: entity.id, columnId, expected };
			};

			it('should add a checkpoint for the column after the other checkpoints', async () => {
				const { id, columnId, expected } = await setup();

				await repo.addColumnCheckpoint(id, runningAttempt.attempts, columnId);

				const job = await repo.findById(id);
				expect(job?.checkpoints).toEqual(expected);
			});
		});

		describe('when the job has no checkpoints', () => {
			const setup = async () => {
				const entity = boardImportJobEntityFactory.build(runningAttempt);
				await em.persist(entity).flush();
				em.clear();
				const columnId = newId();

				return { id: entity.id, columnId };
			};

			it('should add the first checkpoint', async () => {
				const { id, columnId } = await setup();

				await repo.addColumnCheckpoint(id, runningAttempt.attempts, columnId);

				const job = await repo.findById(id);
				expect(job?.checkpoints).toEqual([{ columnId, cardIds: [] }]);
			});
		});
	});

	describe('addCardCheckpoint', () => {
		describe('when the job has checkpoints for two columns', () => {
			const setup = async () => {
				const firstColumnId = new ObjectId();
				const secondColumnId = new ObjectId();
				const firstCardId = new ObjectId();
				const entity = boardImportJobEntityFactory.build({
					...runningAttempt,
					checkpoints: [
						{ columnId: firstColumnId, cardIds: [] },
						{ columnId: secondColumnId, cardIds: [firstCardId] },
					],
				});
				await em.persist(entity).flush();
				em.clear();
				const columnIndex = 1;
				const cardId = newId();
				const expected: BoardImportCheckpoint[] = [
					{ columnId: firstColumnId.toHexString(), cardIds: [] },
					{ columnId: secondColumnId.toHexString(), cardIds: [firstCardId.toHexString(), cardId] },
				];

				return { id: entity.id, columnIndex, cardId, expected };
			};

			it('should add the card to the checkpoint of the column, after its other cards', async () => {
				const { id, columnIndex, cardId, expected } = await setup();

				await repo.addCardCheckpoint(id, runningAttempt.attempts, columnIndex, cardId);

				const job = await repo.findById(id);
				expect(job?.checkpoints).toEqual(expected);
			});
		});
	});

	describe('writes of an attempt', () => {
		describe.each([
			['setBoardId', (id: string, attempt: number) => repo.setBoardId(id, attempt, newId())],
			['resetBoard', (id: string, attempt: number) => repo.resetBoard(id, attempt)],
			['setPlan', (id: string, attempt: number) => repo.setPlan(id, attempt, plan, [])],
			['addColumnCheckpoint', (id: string, attempt: number) => repo.addColumnCheckpoint(id, attempt, newId())],
			['addCardCheckpoint', (id: string, attempt: number) => repo.addCardCheckpoint(id, attempt, 0, newId())],
		])('%s', (_name, write) => {
			const setupJob = async (status: BoardImportJobStatus, attemptsOfJob: number) => {
				const boardId = new ObjectId();
				const columnId = new ObjectId();
				const entity = boardImportJobEntityFactory.build({
					status,
					attempts: attemptsOfJob,
					boardId,
					checkpoints: [{ columnId, cardIds: [] }],
				});
				await em.persist(entity).flush();
				em.clear();
				const expectedProps = {
					boardId: boardId.toHexString(),
					plan: undefined,
					checkpoints: [{ columnId: columnId.toHexString(), cardIds: [] }],
				};

				return { id: entity.id, expectedProps };
			};

			const expectRejectedWithoutChange = async (
				id: string,
				attempt: number,
				expectedProps: Record<string, unknown>
			): Promise<void> => {
				const error: unknown = await write(id, attempt).catch((e: unknown) => e);

				const job = await repo.findById(id);
				expect(error).toBeInstanceOf(BoardImportJobRejectedError);
				expect(error).toMatchObject({ reason: BoardImportJobLogReason.OUTDATED_ATTEMPT });
				expect(job?.getProps()).toMatchObject(expectedProps);
			};

			describe('when the job is running in a later attempt', () => {
				const setup = async () => {
					const attemptsOfJob = 2;
					const attempt = 1;
					const { id, expectedProps } = await setupJob(BoardImportJobStatus.RUNNING, attemptsOfJob);

					return { id, attempt, expectedProps };
				};

				it('should reject the write and not change the job', async () => {
					const { id, attempt, expectedProps } = await setup();

					await expectRejectedWithoutChange(id, attempt, expectedProps);
				});
			});

			describe('when the job has an end status', () => {
				const setup = async () => {
					const attempt = 1;
					const { id, expectedProps } = await setupJob(BoardImportJobStatus.FAILED, attempt);

					return { id, attempt, expectedProps };
				};

				it('should reject the write and not change the job', async () => {
					const { id, attempt, expectedProps } = await setup();

					await expectRejectedWithoutChange(id, attempt, expectedProps);
				});
			});
		});
	});

	describe('startAttempt after writes of an attempt', () => {
		describe('when the job has a plan and checkpoints', () => {
			const setup = async () => {
				const columnId = new ObjectId();
				const cardId = new ObjectId();
				const entity = boardImportJobEntityFactory.build({
					...runningAttempt,
					plan,
					checkpoints: [{ columnId, cardIds: [cardId] }],
				});
				await em.persist(entity).flush();
				em.clear();
				const checkpoints: BoardImportCheckpoint[] = [
					{ columnId: columnId.toHexString(), cardIds: [cardId.toHexString()] },
				];

				return { id: entity.id, checkpoints };
			};

			it('should return the job with its plan and checkpoints', async () => {
				const { id, checkpoints } = await setup();

				const job = await repo.startAttempt(id, new Date());

				expect(job?.plan).toEqual(plan);
				expect(job?.checkpoints).toEqual(checkpoints);
			});
		});
	});
});
