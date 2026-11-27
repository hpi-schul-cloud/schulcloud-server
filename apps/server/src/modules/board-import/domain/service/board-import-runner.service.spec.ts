import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { boardImportJobFactory, intermediateBoardFactory } from '../../testing';
import { BoardImportPlaceholderBoardService } from './board-import-placeholder-board.service';
import { BoardImportJobRejectedError } from '../error';
import { BoardImportJobLogReason } from '../type';
import { BoardImportRunnerService } from './board-import-runner.service';
import { type BoardImportSourceReader } from '../interface';
import { BoardImportSourceReaderRegistryService } from './board-import-source-reader-registry.service';
import { BoardImportTokenService } from './board-import-token.service';

describe(BoardImportRunnerService.name, () => {
	let module: TestingModule;
	let service: BoardImportRunnerService;
	let tokenService: DeepMocked<BoardImportTokenService>;
	let placeholderBoardService: DeepMocked<BoardImportPlaceholderBoardService>;
	let readerRegistry: DeepMocked<BoardImportSourceReaderRegistryService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardImportRunnerService,
				{ provide: BoardImportTokenService, useValue: createMock<BoardImportTokenService>() },
				{
					provide: BoardImportPlaceholderBoardService,
					useValue: createMock<BoardImportPlaceholderBoardService>(),
				},
				{
					provide: BoardImportSourceReaderRegistryService,
					useValue: createMock<BoardImportSourceReaderRegistryService>(),
				},
			],
		}).compile();

		service = module.get(BoardImportRunnerService);
		tokenService = module.get(BoardImportTokenService);
		placeholderBoardService = module.get(BoardImportPlaceholderBoardService);
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

			const reader = createMock<BoardImportSourceReader>();

			tokenService.createToken.mockResolvedValueOnce(token);
			readerRegistry.findByType.mockReturnValueOnce(reader);
			reader.readBoard.mockResolvedValueOnce(board);

			return { job, signal, token, board, reader };
		};

		describe('when the board is written', () => {
			const setup = () => {
				const { job, signal, token, board, reader } = setupRun();

				placeholderBoardService.write.mockImplementationOnce(async (_job, session) => {
					await session.call(() => Promise.resolve());
				});

				return { job, signal, token, board, reader };
			};

			it('should write the board of the job with a token for the job', async () => {
				const { job, signal } = setup();

				await service.run(job, signal);

				expect(placeholderBoardService.write).toHaveBeenCalledWith(job, expect.anything(), expect.anything());
				expect(tokenService.createToken).toHaveBeenCalledWith(job);
			});

			it('should read the source before it writes the board with the model as JSON', async () => {
				const { job, signal, board, reader } = setup();

				await service.run(job, signal);

				expect(readerRegistry.findByType).toHaveBeenCalledWith(job.source.type);
				expect(reader.readBoard).toHaveBeenCalledWith(job, signal);
				expect(placeholderBoardService.write).toHaveBeenCalledWith(job, expect.anything(), JSON.stringify(board));
				expect(reader.readBoard.mock.invocationCallOrder[0]).toBeLessThan(
					placeholderBoardService.write.mock.invocationCallOrder[0]
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

				placeholderBoardService.write.mockImplementationOnce(async (_job, session) => {
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

			it('should write no board and create no token', async () => {
				const { job, signal } = setup();

				await service.run(job, signal).catch(() => undefined);

				expect(placeholderBoardService.write).not.toHaveBeenCalled();
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

			it('should pass the error and write no board', async () => {
				const { job, signal, error } = setup();

				await expect(service.run(job, signal)).rejects.toBe(error);

				expect(placeholderBoardService.write).not.toHaveBeenCalled();
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

			it('should reject the job with the reason that the source is unknown and write no board', async () => {
				const { job, signal, reason } = setup();

				const error: unknown = await service.run(job, signal).catch((e: unknown) => e);

				expect(error).toBeInstanceOf(BoardImportJobRejectedError);
				expect(error).toMatchObject({ reason });
				expect(placeholderBoardService.write).not.toHaveBeenCalled();
				expect(tokenService.createToken).not.toHaveBeenCalled();
			});
		});
	});
});
