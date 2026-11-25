import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@infra/logger';
import { Test, type TestingModule } from '@nestjs/testing';
import { BOARD_IMPORT_CONFIG_TOKEN, BoardImportConfig } from '../../board-import.config';
import { boardImportJobFactory } from '../../testing';
import { BoardImportJobRejectedError, BoardImportJobUnreadableError } from '../error';
import { BOARD_IMPORT_JOB_REPO, type BoardImportJobRepo } from '../interface';
import { BoardImportJobLogReason, BoardImportJobStatus } from '../type';
import { BoardImportJobProcessService } from './board-import-job-process.service';
import { BoardImportRunnerService } from './board-import-runner.service';

describe(BoardImportJobProcessService.name, () => {
	let module: TestingModule;
	let service: BoardImportJobProcessService;
	let repo: DeepMocked<BoardImportJobRepo>;
	let runner: DeepMocked<BoardImportRunnerService>;
	let logger: DeepMocked<Logger>;
	let config: BoardImportConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardImportJobProcessService,
				{
					provide: BOARD_IMPORT_JOB_REPO,
					useValue: createMock<BoardImportJobRepo>(),
				},
				{
					provide: BOARD_IMPORT_CONFIG_TOKEN,
					useValue: new BoardImportConfig(),
				},
				{
					provide: BoardImportRunnerService,
					useValue: createMock<BoardImportRunnerService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(BoardImportJobProcessService);
		repo = module.get(BOARD_IMPORT_JOB_REPO);
		runner = module.get(BoardImportRunnerService);
		logger = module.get(Logger);
		config = module.get(BOARD_IMPORT_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
		jest.useRealTimers();
	});

	describe('process', () => {
		describe('when the job is waiting', () => {
			const setup = () => {
				const now = new Date('2026-01-01T00:00:00.000Z');
				jest.useFakeTimers({ now });

				const job = boardImportJobFactory.build();
				const startedJob = boardImportJobFactory.build({
					id: job.id,
					status: BoardImportJobStatus.RUNNING,
					attempts: 1,
					startedAt: now,
				});

				repo.findById.mockResolvedValueOnce(job);
				repo.startAttempt.mockResolvedValueOnce(startedJob);
				runner.run.mockResolvedValueOnce();
				repo.closeAttempt.mockResolvedValueOnce(true);

				const deadline = new Date(now.getTime() + config.jobMaxDurationInMinutes * 60 * 1000);

				return { job, startedJob, now, deadline };
			};

			it('should pass the deadline of the job to the import', async () => {
				const { job, deadline } = setup();

				await service.process(job.id);

				expect(runner.run.mock.calls[0][2]).toEqual(deadline);
			});

			it('should start the attempt before the import runs', async () => {
				const { job, startedJob, now } = setup();

				await service.process(job.id);

				expect(repo.startAttempt).toHaveBeenCalledWith(job.id, now);
				expect(runner.run).toHaveBeenCalledWith(startedJob, expect.any(AbortSignal), expect.any(Date));
				expect(repo.startAttempt.mock.invocationCallOrder[0]).toBeLessThan(runner.run.mock.invocationCallOrder[0]);
			});

			it('should store the status finished for the attempt after the import', async () => {
				const { job, startedJob } = setup();

				await service.process(job.id);

				expect(repo.closeAttempt).toHaveBeenCalledTimes(1);
				expect(repo.closeAttempt).toHaveBeenCalledWith(
					startedJob.id,
					startedJob.attempts,
					BoardImportJobStatus.FINISHED
				);
				expect(runner.run.mock.invocationCallOrder[0]).toBeLessThan(repo.closeAttempt.mock.invocationCallOrder[0]);
			});

			it('should abort the signal after the import', async () => {
				const { job } = setup();

				await service.process(job.id);

				const signal = runner.run.mock.calls[0][1];
				expect(signal.aborted).toEqual(true);
			});

			it('should log the start and the end with the job id', async () => {
				const { job, startedJob } = setup();

				await service.process(job.id);

				const logData = { jobId: job.id, attempts: startedJob.attempts };
				expect(logger.info).toHaveBeenNthCalledWith(1, 'Board import job started', logData);
				expect(logger.info).toHaveBeenNthCalledWith(2, 'Board import job finished', logData);
			});
		});

		describe('when the job is delivered again and has attempts left', () => {
			const setup = () => {
				const attempts = config.jobMaxAttempts - 1;
				const startedAt = new Date();
				const job = boardImportJobFactory.build({ status: BoardImportJobStatus.RUNNING, attempts, startedAt });
				const startedJob = boardImportJobFactory.build({
					id: job.id,
					status: BoardImportJobStatus.RUNNING,
					attempts: attempts + 1,
					startedAt,
				});
				const status = BoardImportJobStatus.FINISHED;

				repo.findById.mockResolvedValueOnce(job);
				repo.startAttempt.mockResolvedValueOnce(startedJob);
				runner.run.mockResolvedValueOnce();
				repo.closeAttempt.mockResolvedValueOnce(true);

				return { job, startedJob, status };
			};

			it('should process the job again', async () => {
				const { job, startedJob, status } = setup();

				await service.process(job.id);

				expect(runner.run).toHaveBeenCalledWith(startedJob, expect.any(AbortSignal), expect.any(Date));
				expect(repo.closeAttempt).toHaveBeenCalledWith(startedJob.id, startedJob.attempts, status);
			});
		});

		describe('when the job gets an end status between the read and the start', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();
				const logEntry = [
					'Board import job skipped',
					{ jobId: job.id, reason: BoardImportJobLogReason.JOB_CLOSED },
				] as const;

				repo.findById.mockResolvedValueOnce(job);
				repo.startAttempt.mockResolvedValueOnce(null);

				return { job, logEntry };
			};

			it('should resolve and do no work', async () => {
				const { job, logEntry } = setup();

				await service.process(job.id);

				expect(runner.run).not.toHaveBeenCalled();
				expect(repo.closeAttempt).not.toHaveBeenCalled();
				expect(logger.warning).toHaveBeenCalledWith(...logEntry);
			});
		});

		describe('when the job has no attempts left', () => {
			const setup = () => {
				const attempts = config.jobMaxAttempts;
				const job = boardImportJobFactory.build({
					status: BoardImportJobStatus.RUNNING,
					attempts,
					startedAt: new Date(),
				});
				const status = BoardImportJobStatus.FAILED;
				const logEntry = [
					'Board import job failed',
					{ jobId: job.id, reason: BoardImportJobLogReason.MAX_ATTEMPTS, attempts: attempts },
				] as const;

				repo.findById.mockResolvedValueOnce(job);
				repo.closeAttempt.mockResolvedValueOnce(true);

				return { job, status, logEntry };
			};

			it('should save the status failed and not run the import', async () => {
				const { job, status, logEntry } = setup();

				await service.process(job.id);

				expect(repo.closeAttempt).toHaveBeenCalledWith(job.id, job.attempts, status);
				expect(runner.run).not.toHaveBeenCalled();
				expect(logger.warning).toHaveBeenCalledWith(...logEntry);
			});
		});

		describe('when the job is delivered again after its maximum duration', () => {
			const setup = () => {
				const now = new Date('2026-01-01T12:00:00.000Z');
				jest.useFakeTimers({ now });

				const startedAt = new Date(now.getTime() - config.jobMaxDurationInMinutes * 60 * 1000);
				const job = boardImportJobFactory.build({ status: BoardImportJobStatus.RUNNING, attempts: 1, startedAt });
				const status = BoardImportJobStatus.FAILED;
				const logEntry = [
					'Board import job failed',
					{ jobId: job.id, reason: BoardImportJobLogReason.MAX_DURATION, attempts: job.attempts },
				] as const;

				repo.findById.mockResolvedValueOnce(job);
				repo.closeAttempt.mockResolvedValueOnce(true);

				return { job, status, logEntry };
			};

			it('should save the status failed and not run the import', async () => {
				const { job, status, logEntry } = setup();

				await service.process(job.id);

				expect(repo.closeAttempt).toHaveBeenCalledWith(job.id, job.attempts, status);
				expect(runner.run).not.toHaveBeenCalled();
				expect(logger.warning).toHaveBeenCalledWith(...logEntry);
			});
		});

		describe('when the import runs longer than the maximum duration', () => {
			const setup = () => {
				jest.useFakeTimers();

				const job = boardImportJobFactory.build();
				const startedJob = boardImportJobFactory.build({
					id: job.id,
					status: BoardImportJobStatus.RUNNING,
					attempts: 1,
					startedAt: new Date(),
				});
				const status = BoardImportJobStatus.FAILED;
				const maxDurationInMs = config.jobMaxDurationInMinutes * 60 * 1000;
				let signal: AbortSignal | undefined;

				repo.findById.mockResolvedValueOnce(job);
				repo.startAttempt.mockResolvedValueOnce(startedJob);
				runner.run.mockImplementationOnce((_job, abortSignal) => {
					signal = abortSignal;

					return new Promise<void>(() => {});
				});
				repo.closeAttempt.mockResolvedValueOnce(true);

				const getSignal = (): AbortSignal | undefined => signal;

				return { job, startedJob, status, maxDurationInMs, getSignal };
			};

			it('should abort the import and save the status failed', async () => {
				const { job, startedJob, status, maxDurationInMs, getSignal } = setup();

				const result = service.process(job.id);
				await jest.advanceTimersByTimeAsync(maxDurationInMs);
				await result;

				expect(getSignal()?.aborted).toEqual(true);
				expect(repo.closeAttempt).toHaveBeenCalledWith(startedJob.id, startedJob.attempts, status);
			});
		});

		describe('when the import rejects on the last attempt', () => {
			const setup = () => {
				const job = boardImportJobFactory.build({
					status: BoardImportJobStatus.RUNNING,
					attempts: config.jobMaxAttempts - 1,
					startedAt: new Date(),
				});
				const startedJob = boardImportJobFactory.build({
					id: job.id,
					status: BoardImportJobStatus.RUNNING,
					attempts: config.jobMaxAttempts,
					startedAt: job.startedAt,
				});
				const status = BoardImportJobStatus.FAILED;
				const logEntry = [
					'Board import job failed',
					{ jobId: job.id, reason: BoardImportJobLogReason.MAX_ATTEMPTS, attempts: config.jobMaxAttempts },
				] as const;

				repo.findById.mockResolvedValueOnce(job);
				repo.startAttempt.mockResolvedValueOnce(startedJob);
				runner.run.mockRejectedValueOnce(new Error('import failed'));
				repo.closeAttempt.mockResolvedValueOnce(true);

				return { job, startedJob, status, logEntry };
			};

			it('should resolve and save the status failed', async () => {
				const { job, startedJob, status, logEntry } = setup();

				await service.process(job.id);

				expect(repo.closeAttempt).toHaveBeenCalledWith(startedJob.id, startedJob.attempts, status);
				expect(logger.warning).toHaveBeenCalledWith(...logEntry);
			});
		});

		describe('when the import rejects the job and the job has attempts left', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();
				const startedJob = boardImportJobFactory.build({
					id: job.id,
					status: BoardImportJobStatus.RUNNING,
					attempts: 1,
					startedAt: new Date(),
				});
				const reason = BoardImportJobLogReason.BOARD_API_FORBIDDEN;
				const status = BoardImportJobStatus.FAILED;
				const logEntry = ['Board import job failed', { jobId: job.id, reason, attempts: startedJob.attempts }] as const;

				repo.findById.mockResolvedValueOnce(job);
				repo.startAttempt.mockResolvedValueOnce(startedJob);
				runner.run.mockRejectedValueOnce(new BoardImportJobRejectedError(reason));
				repo.closeAttempt.mockResolvedValueOnce(true);

				return { job, startedJob, status, logEntry };
			};

			it('should resolve and save the status failed with the reason', async () => {
				const { job, startedJob, status, logEntry } = setup();

				await service.process(job.id);

				expect(repo.closeAttempt).toHaveBeenCalledWith(startedJob.id, startedJob.attempts, status);
				expect(logger.warning).toHaveBeenCalledWith(...logEntry);
			});
		});

		describe('when the import rejects and the job has attempts left', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();
				const startedJob = boardImportJobFactory.build({
					id: job.id,
					status: BoardImportJobStatus.RUNNING,
					attempts: 1,
					startedAt: new Date(),
				});
				const error = new Error('import failed');

				repo.findById.mockResolvedValueOnce(job);
				repo.startAttempt.mockResolvedValueOnce(startedJob);
				runner.run.mockRejectedValueOnce(error);

				return { job, error };
			};

			it('should pass the error and store no end status', async () => {
				const { job, error } = setup();

				await expect(service.process(job.id)).rejects.toThrow(error);

				expect(repo.closeAttempt).not.toHaveBeenCalled();
			});

			it('should abort the signal', async () => {
				const { job, error } = setup();

				await expect(service.process(job.id)).rejects.toThrow(error);

				const signal = runner.run.mock.calls[0][1];
				expect(signal.aborted).toEqual(true);
			});
		});

		describe('when another worker stored the end status of the job first', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();
				const startedJob = boardImportJobFactory.build({
					id: job.id,
					status: BoardImportJobStatus.RUNNING,
					attempts: 1,
					startedAt: new Date(),
				});
				const logEntry = [
					'Board import job end status not stored',
					{ jobId: job.id, reason: BoardImportJobLogReason.OUTDATED_ATTEMPT, attempts: startedJob.attempts },
				] as const;

				repo.findById.mockResolvedValueOnce(job);
				repo.startAttempt.mockResolvedValueOnce(startedJob);
				runner.run.mockResolvedValueOnce();
				repo.closeAttempt.mockResolvedValueOnce(false);

				return { job, logEntry };
			};

			it('should resolve and log that the end status was not stored', async () => {
				const { job, logEntry } = setup();

				await service.process(job.id);

				expect(logger.warning).toHaveBeenCalledWith(...logEntry);
				expect(logger.info).not.toHaveBeenCalledWith('Board import job finished', expect.anything());
			});
		});

		describe('when another worker stored the end status before the worker sets the job to failed', () => {
			const setup = () => {
				const attempts = config.jobMaxAttempts;
				const job = boardImportJobFactory.build({
					status: BoardImportJobStatus.RUNNING,
					attempts,
					startedAt: new Date(),
				});
				const logEntry = [
					'Board import job end status not stored',
					{ jobId: job.id, reason: BoardImportJobLogReason.OUTDATED_ATTEMPT, attempts },
				] as const;

				repo.findById.mockResolvedValueOnce(job);
				repo.closeAttempt.mockResolvedValueOnce(false);

				return { job, logEntry };
			};

			it('should resolve and log that the end status was not stored', async () => {
				const { job, logEntry } = setup();

				await service.process(job.id);

				expect(logger.warning).toHaveBeenCalledWith(...logEntry);
				expect(logger.warning).not.toHaveBeenCalledWith('Board import job failed', expect.anything());
			});
		});

		describe('when the stored job cannot be read', () => {
			const setup = () => {
				const { id } = boardImportJobFactory.build();
				const logEntry = [
					'Board import job failed',
					{ jobId: id, reason: BoardImportJobLogReason.JOB_UNREADABLE },
				] as const;

				repo.findById.mockRejectedValueOnce(new BoardImportJobUnreadableError(new TypeError()));
				repo.failIfOpen.mockResolvedValueOnce(true);

				return { id, logEntry };
			};

			it('should set the job to failed and resolve without an import', async () => {
				const { id, logEntry } = setup();

				await service.process(id);

				expect(repo.failIfOpen).toHaveBeenCalledWith(id);
				expect(repo.startAttempt).not.toHaveBeenCalled();
				expect(runner.run).not.toHaveBeenCalled();
				expect(logger.warning).toHaveBeenCalledWith(...logEntry);
			});
		});

		describe('when the stored job cannot be read and has an end status', () => {
			const setup = () => {
				const { id } = boardImportJobFactory.build();
				const logEntry = [
					'Board import job skipped',
					{ jobId: id, reason: BoardImportJobLogReason.JOB_CLOSED },
				] as const;

				repo.findById.mockRejectedValueOnce(new BoardImportJobUnreadableError(new TypeError()));
				repo.failIfOpen.mockResolvedValueOnce(false);

				return { id, logEntry };
			};

			it('should resolve and log the skip', async () => {
				const { id, logEntry } = setup();

				await service.process(id);

				expect(repo.failIfOpen).toHaveBeenCalledWith(id);
				expect(runner.run).not.toHaveBeenCalled();
				expect(logger.warning).toHaveBeenCalledWith(...logEntry);
			});
		});

		describe('when the job cannot be loaded for another reason', () => {
			const setup = () => {
				const { id } = boardImportJobFactory.build();
				const error = new Error('database not available');

				repo.findById.mockRejectedValueOnce(error);

				return { id, error };
			};

			it('should reject and not change the job', async () => {
				const { id, error } = setup();

				await expect(service.process(id)).rejects.toThrow(error);

				expect(repo.failIfOpen).not.toHaveBeenCalled();
			});
		});

		describe('when the job does not exist', () => {
			const setup = () => {
				const { id } = boardImportJobFactory.build();
				const logEntry = [
					'Board import job skipped',
					{ jobId: id, reason: BoardImportJobLogReason.JOB_NOT_FOUND },
				] as const;

				repo.findById.mockResolvedValueOnce(null);

				return { id, logEntry };
			};

			it('should resolve and do no work', async () => {
				const { id, logEntry } = setup();

				await service.process(id);

				expect(repo.closeAttempt).not.toHaveBeenCalled();
				expect(runner.run).not.toHaveBeenCalled();
				expect(logger.warning).toHaveBeenCalledWith(...logEntry);
			});
		});

		describe.each([BoardImportJobStatus.FINISHED, BoardImportJobStatus.FAILED])(
			'when the job has the end status %s',
			(status) => {
				const setup = () => {
					const job = boardImportJobFactory.build({ status });
					const logEntry = [
						'Board import job skipped',
						{ jobId: job.id, reason: BoardImportJobLogReason.JOB_CLOSED },
					] as const;

					repo.findById.mockResolvedValueOnce(job);

					return { job, logEntry };
				};

				it('should resolve and do no work', async () => {
					const { job, logEntry } = setup();

					await service.process(job.id);

					expect(repo.closeAttempt).not.toHaveBeenCalled();
					expect(runner.run).not.toHaveBeenCalled();
					expect(logger.warning).toHaveBeenCalledWith(...logEntry);
				});
			}
		);
	});
});
