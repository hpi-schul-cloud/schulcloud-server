import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@infra/logger';
import { Test, type TestingModule } from '@nestjs/testing';
import { BOARD_IMPORT_CONFIG_TOKEN, BoardImportConfig } from '../../board-import.config';
import { boardImportJobFactory } from '../../testing';
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

				return { job, startedJob, now };
			};

			it('should start the attempt before the import runs', async () => {
				const { job, startedJob, now } = setup();

				await service.process(job.id);

				expect(repo.startAttempt).toHaveBeenCalledWith(job.id, now);
				expect(runner.run).toHaveBeenCalledWith(startedJob, expect.any(AbortSignal));
				expect(repo.startAttempt.mock.invocationCallOrder[0]).toBeLessThan(runner.run.mock.invocationCallOrder[0]);
			});

			it('should save the status finished after the import', async () => {
				const { job, startedJob } = setup();

				await service.process(job.id);

				expect(repo.save).toHaveBeenCalledTimes(1);
				expect(repo.save).toHaveBeenCalledWith(startedJob);
				expect(startedJob.status).toEqual(BoardImportJobStatus.FINISHED);
				expect(runner.run.mock.invocationCallOrder[0]).toBeLessThan(repo.save.mock.invocationCallOrder[0]);
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

				return { job, startedJob, status };
			};

			it('should process the job again', async () => {
				const { job, startedJob, status } = setup();

				await service.process(job.id);

				expect(runner.run).toHaveBeenCalledWith(startedJob, expect.any(AbortSignal));
				expect(startedJob.status).toEqual(status);
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
				expect(repo.save).not.toHaveBeenCalled();
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

				return { job, status, logEntry };
			};

			it('should save the status failed and not run the import', async () => {
				const { job, status, logEntry } = setup();

				await service.process(job.id);

				expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ status }));
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

				return { job, status, logEntry };
			};

			it('should save the status failed and not run the import', async () => {
				const { job, status, logEntry } = setup();

				await service.process(job.id);

				expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ status }));
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

				const getSignal = (): AbortSignal | undefined => signal;

				return { job, startedJob, status, maxDurationInMs, getSignal };
			};

			it('should abort the import and save the status failed', async () => {
				const { job, startedJob, status, maxDurationInMs, getSignal } = setup();

				const result = service.process(job.id);
				await jest.advanceTimersByTimeAsync(maxDurationInMs);
				await result;

				expect(getSignal()?.aborted).toEqual(true);
				expect(startedJob.status).toEqual(status);
				expect(repo.save).toHaveBeenLastCalledWith(startedJob);
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

				return { job, startedJob, status, logEntry };
			};

			it('should resolve and save the status failed', async () => {
				const { job, startedJob, status, logEntry } = setup();

				await service.process(job.id);

				expect(startedJob.status).toEqual(status);
				expect(repo.save).toHaveBeenLastCalledWith(startedJob);
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
				const status = BoardImportJobStatus.RUNNING;

				repo.findById.mockResolvedValueOnce(job);
				repo.startAttempt.mockResolvedValueOnce(startedJob);
				runner.run.mockRejectedValueOnce(error);

				return { job, startedJob, error, status };
			};

			it('should pass the error and keep the status running', async () => {
				const { job, startedJob, error, status } = setup();

				await expect(service.process(job.id)).rejects.toThrow(error);

				expect(startedJob.status).toEqual(status);
				expect(repo.save).not.toHaveBeenCalled();
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

				expect(repo.save).not.toHaveBeenCalled();
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

					expect(repo.save).not.toHaveBeenCalled();
					expect(runner.run).not.toHaveBeenCalled();
					expect(logger.warning).toHaveBeenCalledWith(...logEntry);
				});
			}
		);
	});
});
