import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { boardImportJobFactory, intermediateBoardFactory } from '../../testing';
import { BoardImportJobRejectedError } from '../error';
import { BoardImportJobLogReason, type BoardImportNote, BoardImportNoteType, type BoardPlan } from '../type';
import { BoardImportExporterService } from './board-import-exporter.service';
import { BoardImportPlannerService } from './board-import-planner.service';
import { BoardImportRunnerService } from './board-import-runner.service';
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

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardImportRunnerService,
				{ provide: BoardImportTokenService, useValue: createMock<BoardImportTokenService>() },
				{ provide: BOARD_IMPORT_JOB_REPO, useValue: createMock<BoardImportJobRepo>() },
				{ provide: BoardImportPlannerService, useValue: createMock<BoardImportPlannerService>() },
				{ provide: BoardImportExporterService, useValue: createMock<BoardImportExporterService>() },
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

			const plan: BoardPlan = { title: board.title, columns: [] };
			const notes: BoardImportNote[] = [{ type: BoardImportNoteType.BOARD_DESCRIPTION_LEFT_OUT }];

			const reader = createMock<BoardImportSourceReader>();

			tokenService.createToken.mockResolvedValueOnce(token);
			readerRegistry.findByType.mockReturnValueOnce(reader);
			reader.readBoard.mockResolvedValueOnce(board);
			plannerService.plan.mockReturnValueOnce({ plan, notes });

			return { job, signal, token, board, plan, notes, reader };
		};

		describe('when the board is created', () => {
			const setup = () => {
				const { job, signal, token, board, plan, notes, reader } = setupRun();

				exporterService.export.mockImplementationOnce(async (_job, session) => {
					await session.call(() => Promise.resolve());
				});

				return { job, signal, token, board, plan, notes, reader };
			};

			it('should create the board of the plan with a token for the job', async () => {
				const { job, signal, plan } = setup();

				await service.run(job, signal);

				expect(exporterService.export).toHaveBeenCalledWith(job, expect.anything(), plan);
				expect(tokenService.createToken).toHaveBeenCalledWith(job);
			});

			it('should read the source and plan the board before it creates the board', async () => {
				const { job, signal, board, reader } = setup();

				await service.run(job, signal);

				expect(readerRegistry.findByType).toHaveBeenCalledWith(job.source.type);
				expect(reader.readBoard).toHaveBeenCalledWith(job, signal);
				expect(plannerService.plan).toHaveBeenCalledWith(board);
				expect(reader.readBoard.mock.invocationCallOrder[0]).toBeLessThan(
					exporterService.export.mock.invocationCallOrder[0]
				);
			});

			it('should store the notes of the planner in the job before it creates the board', async () => {
				const { job, signal, notes } = setup();

				await service.run(job, signal);

				expect(repo.setNotes).toHaveBeenCalledWith(job.id, notes);
				expect(repo.setNotes.mock.invocationCallOrder[0]).toBeLessThan(
					exporterService.export.mock.invocationCallOrder[0]
				);
			});

			it('should remove the token of the attempt', async () => {
				const { job, signal, token } = setup();

				await service.run(job, signal);

				expect(tokenService.removeToken).toHaveBeenCalledWith(job, token);
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
