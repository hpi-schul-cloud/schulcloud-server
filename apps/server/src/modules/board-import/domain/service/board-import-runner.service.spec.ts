import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { boardImportJobFactory, boardPlanFactory, intermediateBoardFactory } from '../../testing';
import { BoardImportJobRejectedError } from '../error';
import { BOARD_PLAN_VERSION, BoardImportJobLogReason, type BoardImportNote, BoardImportNoteType } from '../type';
import { BoardImportExporterService } from './board-import-exporter.service';
import { BoardImportPlannerService } from './board-import-planner.service';
import { BoardImportRunnerService } from './board-import-runner.service';
import { BoardImportServerClientService } from './board-import-server-client.service';
import { BOARD_IMPORT_JOB_REPO, type BoardImportJobRepo, type BoardImportSourceReader } from '../interface';
import { BoardImportSourceReaderRegistryService } from './board-import-source-reader-registry.service';
import { BoardImportTokenService } from './board-import-token.service';

describe(BoardImportRunnerService.name, () => {
	let module: TestingModule;
	let service: BoardImportRunnerService;
	let tokenService: DeepMocked<BoardImportTokenService>;
	let repo: DeepMocked<BoardImportJobRepo>;
	let plannerService: DeepMocked<BoardImportPlannerService>;
	let exporterService: DeepMocked<BoardImportExporterService>;
	let readerRegistry: DeepMocked<BoardImportSourceReaderRegistryService>;
	let serverClient: DeepMocked<BoardImportServerClientService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardImportRunnerService,
				{ provide: BoardImportTokenService, useValue: createMock<BoardImportTokenService>() },
				{ provide: BOARD_IMPORT_JOB_REPO, useValue: createMock<BoardImportJobRepo>() },
				{ provide: BoardImportPlannerService, useValue: createMock<BoardImportPlannerService>() },
				{ provide: BoardImportExporterService, useValue: createMock<BoardImportExporterService>() },
				{ provide: BoardImportServerClientService, useValue: createMock<BoardImportServerClientService>() },
				{
					provide: BoardImportSourceReaderRegistryService,
					useValue: createMock<BoardImportSourceReaderRegistryService>(),
				},
			],
		}).compile();

		service = module.get(BoardImportRunnerService);
		tokenService = module.get(BoardImportTokenService);
		repo = module.get(BOARD_IMPORT_JOB_REPO);
		plannerService = module.get(BoardImportPlannerService);
		exporterService = module.get(BoardImportExporterService);
		readerRegistry = module.get(BoardImportSourceReaderRegistryService);
		serverClient = module.get(BoardImportServerClientService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('run', () => {
		const setupRun = () => {
			const job = boardImportJobFactory.build();
			const { signal } = new AbortController();
			const token = 'token';
			const board = intermediateBoardFactory.build();

			const plan = boardPlanFactory.build({ title: board.title });
			const notes: BoardImportNote[] = [{ type: BoardImportNoteType.BOARD_DESCRIPTION_LEFT_OUT }];

			const reader = createMock<BoardImportSourceReader>();
			const features = { linkElementEnabled: false };

			tokenService.createToken.mockResolvedValueOnce(token);
			serverClient.getInstanceFeatures.mockResolvedValueOnce(features);
			readerRegistry.findByType.mockReturnValueOnce(reader);
			reader.readBoard.mockResolvedValueOnce(board);
			plannerService.plan.mockReturnValueOnce({ plan, notes });

			return { job, signal, token, board, plan, notes, reader, features };
		};

		describe('when the board is created', () => {
			const setup = () => {
				const data = setupRun();

				exporterService.export.mockImplementationOnce(async (_job, session) => {
					await session.call(() => Promise.resolve());
				});

				return data;
			};

			it('should create the board of the plan with a token for the job', async () => {
				const { job, signal, plan } = setup();

				await service.run(job, signal);

				expect(exporterService.export).toHaveBeenCalledWith(job, expect.anything(), plan);
				expect(tokenService.createToken).toHaveBeenCalledWith(job);
			});

			it('should read the source and plan the board before it creates the board', async () => {
				const { job, signal, board, reader, features } = setup();

				await service.run(job, signal);

				expect(readerRegistry.findByType).toHaveBeenCalledWith(job.source.type);
				expect(reader.readBoard).toHaveBeenCalledWith(job, signal);
				expect(plannerService.plan).toHaveBeenCalledWith(board, features);
				expect(reader.readBoard.mock.invocationCallOrder[0]).toBeLessThan(
					exporterService.export.mock.invocationCallOrder[0]
				);
			});

			it('should store the plan and the notes of the planner in the job before it creates the board', async () => {
				const { job, signal, plan, notes } = setup();

				await service.run(job, signal);

				expect(repo.setPlan).toHaveBeenCalledWith(job.id, job.attempts, plan, notes);
				expect(repo.setPlan.mock.invocationCallOrder[0]).toBeLessThan(
					exporterService.export.mock.invocationCallOrder[0]
				);
			});

			it('should remove the token of the attempt', async () => {
				const { job, signal, token } = setup();

				await service.run(job, signal);

				expect(tokenService.removeToken).toHaveBeenCalledWith(job, token);
			});
		});

		describe('when the job has a plan from an attempt before', () => {
			const setup = () => {
				const plan = boardPlanFactory.build();
				const job = boardImportJobFactory.build({ plan });
				const { signal } = new AbortController();

				return { job, signal, plan };
			};

			it('should create the board of the stored plan', async () => {
				const { job, signal, plan } = setup();

				await service.run(job, signal);

				expect(exporterService.export).toHaveBeenCalledWith(job, expect.anything(), plan);
			});

			it('should not read the source and not plan the board again', async () => {
				const { job, signal } = setup();

				await service.run(job, signal);

				expect(readerRegistry.findByType).not.toHaveBeenCalled();
				expect(plannerService.plan).not.toHaveBeenCalled();
				expect(repo.setPlan).not.toHaveBeenCalled();
			});
		});

		describe('when the stored plan of the job has another version', () => {
			const setup = () => {
				const plan = boardPlanFactory.build({ version: BOARD_PLAN_VERSION + 1 });
				const job = boardImportJobFactory.build({ plan });
				const { signal } = new AbortController();
				const reason = BoardImportJobLogReason.PLAN_VERSION_NOT_SUPPORTED;

				return { job, signal, reason };
			};

			it('should reject the job with the reason that the version is not supported', async () => {
				const { job, signal, reason } = setup();

				const error: unknown = await service.run(job, signal).catch((e: unknown) => e);

				expect(error).toBeInstanceOf(BoardImportJobRejectedError);
				expect(error).toMatchObject({ reason });
			});

			it('should create no board and not read the source', async () => {
				const { job, signal } = setup();

				await service.run(job, signal).catch(() => undefined);

				expect(exporterService.export).not.toHaveBeenCalled();
				expect(readerRegistry.findByType).not.toHaveBeenCalled();
			});
		});

		describe('when a request fails', () => {
			const setup = () => {
				const { job, signal, token } = setupRun();
				const error = new Error('request failed');

				exporterService.export.mockImplementationOnce(async (_job, session) => {
					await session.call(() => Promise.reject(error));
				});

				return { job, signal, token, error };
			};

			it('should remove the token of the attempt and pass the error', async () => {
				const { job, signal, token, error } = setup();

				await expect(service.run(job, signal)).rejects.toBe(error);

				expect(tokenService.removeToken).toHaveBeenCalledWith(job, token);
			});
		});

		describe('when the source is not readable', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();
				const { signal } = new AbortController();
				const error = new BoardImportJobRejectedError(BoardImportJobLogReason.SOURCE_NOT_READABLE);
				const reader = createMock<BoardImportSourceReader>();

				readerRegistry.findByType.mockReturnValueOnce(reader);
				reader.readBoard.mockRejectedValueOnce(error);

				return { job, signal, error };
			};

			it('should pass the error', async () => {
				const { job, signal, error } = setup();

				await expect(service.run(job, signal)).rejects.toBe(error);
			});

			it('should create no board and create no token', async () => {
				const { job, signal } = setup();

				await service.run(job, signal).catch(() => undefined);

				expect(exporterService.export).not.toHaveBeenCalled();
				expect(tokenService.createToken).not.toHaveBeenCalled();
			});
		});

		describe('when the read of the source fails with a temporary error', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();
				const { signal } = new AbortController();
				const error = new Error('request to the source failed');
				const reader = createMock<BoardImportSourceReader>();

				readerRegistry.findByType.mockReturnValueOnce(reader);
				reader.readBoard.mockRejectedValueOnce(error);

				return { job, signal, error };
			};

			it('should pass the error and create no board', async () => {
				const { job, signal, error } = setup();

				await expect(service.run(job, signal)).rejects.toBe(error);

				expect(exporterService.export).not.toHaveBeenCalled();
			});
		});

		describe('when the features of the instance cannot be read', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();
				const { signal } = new AbortController();
				const error = new Error('config not available');

				serverClient.getInstanceFeatures.mockRejectedValueOnce(error);

				return { job, signal, error };
			};

			it('should pass the error, store no plan and create no board', async () => {
				const { job, signal, error } = setup();

				await expect(service.run(job, signal)).rejects.toBe(error);

				expect(readerRegistry.findByType).not.toHaveBeenCalled();
				expect(plannerService.plan).not.toHaveBeenCalled();
				expect(repo.setPlan).not.toHaveBeenCalled();
				expect(exporterService.export).not.toHaveBeenCalled();
			});
		});

		describe('when no reader is registered for the source of the job', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();
				const { signal } = new AbortController();
				const reason = BoardImportJobLogReason.SOURCE_UNKNOWN;

				readerRegistry.findByType.mockReturnValueOnce(undefined);

				return { job, signal, reason };
			};

			it('should reject the job with the reason that the source is unknown and create no board', async () => {
				const { job, signal, reason } = setup();

				const error: unknown = await service.run(job, signal).catch((e: unknown) => e);

				expect(error).toBeInstanceOf(BoardImportJobRejectedError);
				expect(error).toMatchObject({ reason });
				expect(exporterService.export).not.toHaveBeenCalled();
				expect(tokenService.createToken).not.toHaveBeenCalled();
			});
		});
	});
});
