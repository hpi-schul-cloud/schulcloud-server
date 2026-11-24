import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@infra/logger';
import { Test, type TestingModule } from '@nestjs/testing';
import { BOARD_IMPORT_CONFIG_TOKEN, BoardImportConfig } from '../../board-import.config';
import { BoardImportJobEvent, BoardImportJobEventReason, BoardImportJobLoggable } from '../../loggable';
import { boardImportJobFactory } from '../../testing';
import { BOARD_IMPORT_JOB_REPO, type BoardImportJobRepo } from '../interface';
import { BoardImportJobStatus } from '../type';
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
				const savedStatuses: BoardImportJobStatus[] = [];
				let statusAtRun: BoardImportJobStatus | undefined;

				repo.findById.mockResolvedValueOnce(job);
				repo.save.mockImplementation((savedJob) => {
					savedStatuses.push(savedJob.status);

					return Promise.resolve(savedJob);
				});
				runner.run.mockImplementationOnce(() => {
					statusAtRun = savedStatuses.at(-1);

					return Promise.resolve();
				});

				const getStatusAtRun = (): BoardImportJobStatus | undefined => statusAtRun;

				return { job, now, savedStatuses, getStatusAtRun };
			};

			it('should save the status running before the import runs', async () => {
				const { job, getStatusAtRun } = setup();

				await service.process(job.id);

				expect(getStatusAtRun()).toEqual(BoardImportJobStatus.RUNNING);
			});

			it('should count the attempt and set the start time', async () => {
				const { job, now } = setup();

				await service.process(job.id);

				expect(job.attempts).toEqual(1);
				expect(job.startedAt).toEqual(now);
			});

			it('should save the status finished as the last step', async () => {
				const { job, savedStatuses } = setup();

				await service.process(job.id);

				expect(savedStatuses).toEqual([BoardImportJobStatus.RUNNING, BoardImportJobStatus.FINISHED]);
			});

			it('should log the start and the end with the job id', async () => {
				const { job } = setup();

				await service.process(job.id);

				expect(logger.info).toHaveBeenNthCalledWith(
					1,
					new BoardImportJobLoggable(job.id, BoardImportJobEvent.STARTED, { attempts: 1 })
				);
				expect(logger.info).toHaveBeenNthCalledWith(
					2,
					new BoardImportJobLoggable(job.id, BoardImportJobEvent.FINISHED, { attempts: 1 })
				);
			});
		});

		describe('when the job is delivered again and has attempts left', () => {
			const setup = () => {
				const attempts = config.jobMaxAttempts - 1;
				const job = boardImportJobFactory.build({
					status: BoardImportJobStatus.RUNNING,
					attempts,
					startedAt: new Date(),
				});
				const status = BoardImportJobStatus.FINISHED;

				repo.findById.mockResolvedValueOnce(job);
				runner.run.mockResolvedValueOnce();

				return { job, attempts, status };
			};

			it('should process the job again and count the attempt', async () => {
				const { job, attempts, status } = setup();

				await service.process(job.id);

				expect(runner.run).toHaveBeenCalledWith(job, expect.any(AbortSignal));
				expect(job.attempts).toEqual(attempts + 1);
				expect(job.status).toEqual(status);
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
				const loggable = new BoardImportJobLoggable(job.id, BoardImportJobEvent.FAILED, {
					reason: BoardImportJobEventReason.MAX_ATTEMPTS,
					attempts: attempts,
				});

				repo.findById.mockResolvedValueOnce(job);

				return { job, status, loggable };
			};

			it('should save the status failed and not run the import', async () => {
				const { job, status, loggable } = setup();

				await service.process(job.id);

				expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ status }));
				expect(runner.run).not.toHaveBeenCalled();
				expect(logger.warning).toHaveBeenCalledWith(loggable);
			});
		});

		describe('when the job is delivered again after its maximum duration', () => {
			const setup = () => {
				const now = new Date('2026-01-01T12:00:00.000Z');
				jest.useFakeTimers({ now });

				const startedAt = new Date(now.getTime() - config.jobMaxDurationInMinutes * 60 * 1000);
				const job = boardImportJobFactory.build({ status: BoardImportJobStatus.RUNNING, attempts: 1, startedAt });
				const status = BoardImportJobStatus.FAILED;
				const loggable = new BoardImportJobLoggable(job.id, BoardImportJobEvent.FAILED, {
					reason: BoardImportJobEventReason.MAX_DURATION,
					attempts: job.attempts,
				});

				repo.findById.mockResolvedValueOnce(job);

				return { job, status, loggable };
			};

			it('should save the status failed and not run the import', async () => {
				const { job, status, loggable } = setup();

				await service.process(job.id);

				expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ status }));
				expect(runner.run).not.toHaveBeenCalled();
				expect(logger.warning).toHaveBeenCalledWith(loggable);
			});
		});

		describe('when the import runs longer than the maximum duration', () => {
			const setup = () => {
				jest.useFakeTimers();

				const job = boardImportJobFactory.build();
				const status = BoardImportJobStatus.FAILED;
				const maxDurationInMs = config.jobMaxDurationInMinutes * 60 * 1000;
				let signal: AbortSignal | undefined;

				repo.findById.mockResolvedValueOnce(job);
				runner.run.mockImplementationOnce((_job, abortSignal) => {
					signal = abortSignal;

					return new Promise<void>(() => {});
				});

				const getSignal = (): AbortSignal | undefined => signal;

				return { job, status, maxDurationInMs, getSignal };
			};

			it('should abort the import and save the status failed', async () => {
				const { job, status, maxDurationInMs, getSignal } = setup();

				const result = service.process(job.id);
				await jest.advanceTimersByTimeAsync(maxDurationInMs);
				await result;

				expect(getSignal()?.aborted).toEqual(true);
				expect(job.status).toEqual(status);
				expect(repo.save).toHaveBeenLastCalledWith(expect.objectContaining({ status }));
			});
		});

		describe('when the import rejects on the last attempt', () => {
			const setup = () => {
				const attempts = config.jobMaxAttempts - 1;
				const job = boardImportJobFactory.build({
					status: BoardImportJobStatus.RUNNING,
					attempts,
					startedAt: new Date(),
				});
				const status = BoardImportJobStatus.FAILED;
				const loggable = new BoardImportJobLoggable(job.id, BoardImportJobEvent.FAILED, {
					reason: BoardImportJobEventReason.MAX_ATTEMPTS,
					attempts: config.jobMaxAttempts,
				});

				repo.findById.mockResolvedValueOnce(job);
				runner.run.mockRejectedValueOnce(new Error('import failed'));

				return { job, status, loggable };
			};

			it('should resolve and save the status failed', async () => {
				const { job, status, loggable } = setup();

				await service.process(job.id);

				expect(repo.save).toHaveBeenLastCalledWith(expect.objectContaining({ status }));
				expect(logger.warning).toHaveBeenCalledWith(loggable);
			});
		});

		describe('when the import rejects and the job has attempts left', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();
				const error = new Error('import failed');
				const status = BoardImportJobStatus.RUNNING;

				repo.findById.mockResolvedValueOnce(job);
				runner.run.mockRejectedValueOnce(error);

				return { job, error, status };
			};

			it('should pass the error and keep the status running', async () => {
				const { job, error, status } = setup();

				await expect(service.process(job.id)).rejects.toThrow(error);

				expect(job.status).toEqual(status);
				expect(repo.save).toHaveBeenCalledTimes(1);
			});
		});

		describe('when the job does not exist', () => {
			const setup = () => {
				const { id } = boardImportJobFactory.build();
				const loggable = new BoardImportJobLoggable(id, BoardImportJobEvent.SKIPPED, {
					reason: BoardImportJobEventReason.JOB_NOT_FOUND,
				});

				repo.findById.mockResolvedValueOnce(null);

				return { id, loggable };
			};

			it('should resolve and do no work', async () => {
				const { id, loggable } = setup();

				await service.process(id);

				expect(repo.save).not.toHaveBeenCalled();
				expect(runner.run).not.toHaveBeenCalled();
				expect(logger.warning).toHaveBeenCalledWith(loggable);
			});
		});

		describe.each([BoardImportJobStatus.FINISHED, BoardImportJobStatus.FAILED])(
			'when the job has the end status %s',
			(status) => {
				const setup = () => {
					const job = boardImportJobFactory.build({ status });
					const loggable = new BoardImportJobLoggable(job.id, BoardImportJobEvent.SKIPPED, {
						reason: BoardImportJobEventReason.JOB_CLOSED,
					});

					repo.findById.mockResolvedValueOnce(job);

					return { job, loggable };
				};

				it('should resolve and do no work', async () => {
					const { job, loggable } = setup();

					await service.process(job.id);

					expect(repo.save).not.toHaveBeenCalled();
					expect(runner.run).not.toHaveBeenCalled();
					expect(logger.warning).toHaveBeenCalledWith(loggable);
				});
			}
		);
	});
});
