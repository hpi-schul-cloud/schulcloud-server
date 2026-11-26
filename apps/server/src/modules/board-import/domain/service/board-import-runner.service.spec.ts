import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { boardImportJobFactory } from '../../testing';
import { BoardImportPlaceholderBoardService } from './board-import-placeholder-board.service';
import { BoardImportRunnerService } from './board-import-runner.service';
import { BoardImportTokenService } from './board-import-token.service';

describe(BoardImportRunnerService.name, () => {
	let module: TestingModule;
	let service: BoardImportRunnerService;
	let tokenService: DeepMocked<BoardImportTokenService>;
	let placeholderBoardService: DeepMocked<BoardImportPlaceholderBoardService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardImportRunnerService,
				{ provide: BoardImportTokenService, useValue: createMock<BoardImportTokenService>() },
				{
					provide: BoardImportPlaceholderBoardService,
					useValue: createMock<BoardImportPlaceholderBoardService>(),
				},
			],
		}).compile();

		service = module.get(BoardImportRunnerService);
		tokenService = module.get(BoardImportTokenService);
		placeholderBoardService = module.get(BoardImportPlaceholderBoardService);
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

			tokenService.createToken.mockResolvedValueOnce(token);

			return { job, signal, token };
		};

		describe('when the board is written', () => {
			const setup = () => {
				const { job, signal, token } = setupRun();

				placeholderBoardService.write.mockImplementationOnce(async (_job, session) => {
					await session.call(() => Promise.resolve());
				});

				return { job, signal, token };
			};

			it('should write the board of the job with a token for the job', async () => {
				const { job, signal } = setup();

				await service.run(job, signal);

				expect(placeholderBoardService.write).toHaveBeenCalledWith(job, expect.anything());
				expect(tokenService.createToken).toHaveBeenCalledWith(job);
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
	});
});
