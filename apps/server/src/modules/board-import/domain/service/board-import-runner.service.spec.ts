import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { boardImportJobFactory } from '../../testing';
import { BoardImportPlaceholderBoardService } from './board-import-placeholder-board.service';
import { BoardImportJobRejectedError } from '../error';
import { BoardImportJobLogReason } from '../type';
import { BoardImportRunnerService } from './board-import-runner.service';
import { BoardImportTaskcardsService } from './board-import-taskcards.service';
import { BoardImportTokenService } from './board-import-token.service';

describe(BoardImportRunnerService.name, () => {
	let module: TestingModule;
	let service: BoardImportRunnerService;
	let tokenService: DeepMocked<BoardImportTokenService>;
	let placeholderBoardService: DeepMocked<BoardImportPlaceholderBoardService>;
	let taskcardsService: DeepMocked<BoardImportTaskcardsService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardImportRunnerService,
				{ provide: BoardImportTokenService, useValue: createMock<BoardImportTokenService>() },
				{
					provide: BoardImportPlaceholderBoardService,
					useValue: createMock<BoardImportPlaceholderBoardService>(),
				},
				{ provide: BoardImportTaskcardsService, useValue: createMock<BoardImportTaskcardsService>() },
			],
		}).compile();

		service = module.get(BoardImportRunnerService);
		tokenService = module.get(BoardImportTokenService);
		placeholderBoardService = module.get(BoardImportPlaceholderBoardService);
		taskcardsService = module.get(BoardImportTaskcardsService);
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
			const sourceResponse = '{"data":{"board":{}}}';

			tokenService.createToken.mockResolvedValueOnce(token);
			taskcardsService.readBoard.mockResolvedValueOnce(sourceResponse);

			return { job, signal, token, sourceResponse };
		};

		describe('when the board is written', () => {
			const setup = () => {
				const { job, signal, token, sourceResponse } = setupRun();

				placeholderBoardService.write.mockImplementationOnce(async (_job, session) => {
					await session.call(() => Promise.resolve());
				});

				return { job, signal, token, sourceResponse };
			};

			it('should write the board of the job with a token for the job', async () => {
				const { job, signal } = setup();

				await service.run(job, signal);

				expect(placeholderBoardService.write).toHaveBeenCalledWith(job, expect.anything(), expect.anything());
				expect(tokenService.createToken).toHaveBeenCalledWith(job);
			});

			it('should read the source before it writes the board with the answer of the source', async () => {
				const { job, signal, sourceResponse } = setup();

				await service.run(job, signal);

				expect(taskcardsService.readBoard).toHaveBeenCalledWith(job, signal);
				expect(placeholderBoardService.write).toHaveBeenCalledWith(job, expect.anything(), sourceResponse);
				expect(taskcardsService.readBoard.mock.invocationCallOrder[0]).toBeLessThan(
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

				taskcardsService.readBoard.mockRejectedValueOnce(error);

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
				const error = new Error('TaskCards request failed');
				taskcardsService.readBoard.mockRejectedValueOnce(error);

				return { job, signal, error };
			};

			it('should pass the error and write no board', async () => {
				const { job, signal, error } = setup();

				await expect(service.run(job, signal)).rejects.toBe(error);

				expect(placeholderBoardService.write).not.toHaveBeenCalled();
			});
		});
	});
});
