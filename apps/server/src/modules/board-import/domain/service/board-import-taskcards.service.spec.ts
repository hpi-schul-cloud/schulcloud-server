import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { boardImportJobFactory } from '../../testing';
import { BoardImportJobRejectedError } from '../error';
import { BoardImportJobLogReason, BoardImportSourceType } from '../type';
import { BoardImportSourceHttpClientService } from './board-import-source-http-client.service';
import { BoardImportTaskcardsService } from './board-import-taskcards.service';

const readFixture = (name: string): string => {
	const fixture = readFileSync(join(__dirname, '../../testing/fixtures/taskcards', name), 'utf8');

	return fixture;
};

describe(BoardImportTaskcardsService.name, () => {
	let module: TestingModule;
	let service: BoardImportTaskcardsService;
	let httpClient: DeepMocked<BoardImportSourceHttpClientService>;

	const boardId = '793bed21-a8ac-4a26-910e-2c3305ac6c0d';
	const token = '0599256f-0bd0-498b-b231-1899dd79a644';
	const visitorId = '00000000-0000-4000-8000-000000000000';
	const visitorBody = readFixture('create-visitor.json');
	const boardBody = readFixture('board-pinboard.json');
	const notReadableBody = readFixture('board-not-readable.json');
	const graphqlUrl = 'https://www.taskcards.de/graphql';
	const accessUrl = `https://www.taskcards.de/api/boards/${boardId}/permissions/${token}/accesses`;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardImportTaskcardsService,
				{ provide: BoardImportSourceHttpClientService, useValue: createMock<BoardImportSourceHttpClientService>() },
			],
		}).compile();

		service = module.get(BoardImportTaskcardsService);
		httpClient = module.get(BoardImportSourceHttpClientService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
		jest.useRealTimers();
	});

	const setupJob = (link: string) => {
		const job = boardImportJobFactory.build({ source: { type: BoardImportSourceType.TASKCARDS, link } });
		const { signal } = new AbortController();

		return { job, signal };
	};

	const setupJobWithToken = () => setupJob(`https://www.taskcards.de/#/board/${boardId}?token=${token}`);

	const setupJobWithoutToken = () => setupJob(`https://www.taskcards.de/#/board/${boardId}`);

	const mockResponses = (...responses: { status: number; body: string }[]): void => {
		responses.forEach((response) => httpClient.request.mockResolvedValueOnce(response));
	};

	const readBoardError = async (...args: Parameters<BoardImportTaskcardsService['readBoard']>): Promise<unknown> => {
		const error: unknown = await service.readBoard(...args).catch((e: unknown) => e);

		return error;
	};

	const expectNotReadable = (error: unknown): void => {
		expect(error).toBeInstanceOf(BoardImportJobRejectedError);
		expect(error).toHaveProperty('reason', BoardImportJobLogReason.SOURCE_NOT_READABLE);
	};

	const expectTemporaryError = (error: unknown): void => {
		expect(error).toBeInstanceOf(Error);
		expect(error).not.toBeInstanceOf(BoardImportJobRejectedError);
	};

	describe('readBoard', () => {
		describe('when the link has a token and the board is shared', () => {
			const setup = () => {
				const { job, signal } = setupJobWithToken();
				mockResponses({ status: 200, body: visitorBody }, { status: 201, body: '' }, { status: 200, body: boardBody });

				return { job, signal };
			};

			it('should return the raw answer of the board query', async () => {
				const { job, signal } = setup();

				const result = await service.readBoard(job, signal);

				expect(result).toBe(boardBody);
			});

			it('should create a visitor, unlock the access and then read the board', async () => {
				const { job, signal } = setup();

				await service.readBoard(job, signal);

				expect(httpClient.request).toHaveBeenCalledTimes(3);
				expect(httpClient.request).toHaveBeenNthCalledWith(1, {
					method: 'POST',
					url: graphqlUrl,
					headers: { 'Content-Type': 'application/json' },
					body: expect.stringContaining('createVisitor'),
					sourceType: BoardImportSourceType.TASKCARDS,
					signal,
				});
				expect(httpClient.request).toHaveBeenNthCalledWith(2, {
					method: 'POST',
					url: accessUrl,
					headers: { 'Content-Type': 'application/json', 'x-token': visitorId },
					body: JSON.stringify({ password: '' }),
					sourceType: BoardImportSourceType.TASKCARDS,
					signal,
				});
				expect(httpClient.request).toHaveBeenNthCalledWith(3, {
					method: 'POST',
					url: graphqlUrl,
					headers: { 'Content-Type': 'application/json', 'x-token': visitorId },
					body: expect.stringContaining(`"variables":{"id":"${boardId}"}`),
					sourceType: BoardImportSourceType.TASKCARDS,
					signal,
				});
			});

			it('should ask for the board id first and not for the comments', async () => {
				const { job, signal } = setup();

				await service.readBoard(job, signal);

				const { body } = httpClient.request.mock.calls[2][0];
				expect(body).toMatch(/board\(id: \$id\) \{ id /);
				expect(body).not.toContain('comments');
			});
		});

		describe('when the link has no token', () => {
			it('should read the board without the access call', async () => {
				const { job, signal } = setupJobWithoutToken();
				mockResponses({ status: 200, body: visitorBody }, { status: 200, body: boardBody });

				const result = await service.readBoard(job, signal);

				expect(result).toBe(boardBody);
				expect(httpClient.request).toHaveBeenCalledTimes(2);
			});
		});

		describe('when the access is unlocked already', () => {
			it('should accept the status 409 and read the board', async () => {
				const { job, signal } = setupJobWithToken();
				mockResponses({ status: 200, body: visitorBody }, { status: 409, body: '' }, { status: 200, body: boardBody });

				const result = await service.readBoard(job, signal);

				expect(result).toBe(boardBody);
			});
		});

		describe('when the source rejects the token of the link', () => {
			it.each([403, 404])('should reject the job for the status %s', async (status: number) => {
				const { job, signal } = setupJobWithToken();
				mockResponses({ status: 200, body: visitorBody }, { status, body: '{"message":"Permission is not available"}' });

				const error = await readBoardError(job, signal);

				expectNotReadable(error);
				expect(httpClient.request).toHaveBeenCalledTimes(2);
			});
		});

		describe('when the link contains no board id', () => {
			it('should reject the job without a request', async () => {
				const { job, signal } = setupJob('https://www.taskcards.de/#/dashboard');

				const error = await readBoardError(job, signal);

				expectNotReadable(error);
				expect(httpClient.request).not.toHaveBeenCalled();
			});
		});

		describe('when the visitor answer contains no id', () => {
			it('should throw an error that permits a new attempt', async () => {
				const { job, signal } = setupJobWithoutToken();
				mockResponses({ status: 200, body: '{"data":{"createVisitor":null}}' });

				const error = await readBoardError(job, signal);

				expectTemporaryError(error);
			});
		});

		describe('when the board is not readable for the visitor and the link has no token', () => {
			it('should reject the job after one board query', async () => {
				const { job, signal } = setupJobWithoutToken();
				mockResponses({ status: 200, body: visitorBody }, { status: 200, body: notReadableBody });

				const error = await readBoardError(job, signal);

				expectNotReadable(error);
				expect(httpClient.request).toHaveBeenCalledTimes(2);
			});
		});

		describe('when the board query fails first after the access call', () => {
			it('should try the board query again and return the board', async () => {
				jest.useFakeTimers();
				const { job, signal } = setupJobWithToken();
				mockResponses(
					{ status: 200, body: visitorBody },
					{ status: 201, body: '' },
					{ status: 200, body: notReadableBody },
					{ status: 200, body: notReadableBody },
					{ status: 200, body: boardBody }
				);

				const promise = service.readBoard(job, signal);
				await jest.advanceTimersByTimeAsync(300 + 800);
				const result = await promise;

				expect(result).toBe(boardBody);
				expect(httpClient.request).toHaveBeenCalledTimes(5);
			});
		});

		describe('when the board stays not readable after the access call', () => {
			it('should reject the job after three board queries', async () => {
				jest.useFakeTimers();
				const { job, signal } = setupJobWithToken();
				mockResponses(
					{ status: 200, body: visitorBody },
					{ status: 201, body: '' },
					{ status: 200, body: notReadableBody },
					{ status: 200, body: notReadableBody },
					{ status: 200, body: notReadableBody }
				);

				const promise = readBoardError(job, signal);
				await jest.advanceTimersByTimeAsync(300 + 800);
				const error = await promise;

				expectNotReadable(error);
				expect(httpClient.request).toHaveBeenCalledTimes(5);
			});
		});

		describe('when the board query gives another GraphQL error', () => {
			it('should reject the job without a second board query', async () => {
				const { job, signal } = setupJobWithToken();
				const body = JSON.stringify({ errors: [{ message: 'Syntax Error', extensions: { code: 'GRAPHQL_PARSE_FAILED' } }] });
				mockResponses({ status: 200, body: visitorBody }, { status: 201, body: '' }, { status: 200, body });

				const error = await readBoardError(job, signal);

				expectNotReadable(error);
				expect(httpClient.request).toHaveBeenCalledTimes(3);
			});
		});

		describe('when the board query gives no board and no error', () => {
			it('should reject the job', async () => {
				const { job, signal } = setupJobWithoutToken();
				mockResponses({ status: 200, body: visitorBody }, { status: 200, body: '{"data":{"board":null}}' });

				const error = await readBoardError(job, signal);

				expectNotReadable(error);
			});
		});

		describe('when the source answers with a temporary error status', () => {
			it.each([408, 429, 500, 503])('should permit a new attempt for the status %s on the visitor call', async (status) => {
				const { job, signal } = setupJobWithToken();
				mockResponses({ status, body: '' });

				const error = await readBoardError(job, signal);

				expectTemporaryError(error);
			});

			it.each([429, 500, 503])('should permit a new attempt for the status %s on the access call', async (status) => {
				const { job, signal } = setupJobWithToken();
				mockResponses({ status: 200, body: visitorBody }, { status, body: '' });

				const error = await readBoardError(job, signal);

				expectTemporaryError(error);
			});

			it.each([429, 500, 503])('should permit a new attempt for the status %s on the board query', async (status) => {
				const { job, signal } = setupJobWithToken();
				mockResponses({ status: 200, body: visitorBody }, { status: 201, body: '' }, { status, body: '' });

				const error = await readBoardError(job, signal);

				expectTemporaryError(error);
			});
		});

		describe('when the board query answers with status 400', () => {
			it('should reject the job', async () => {
				const { job, signal } = setupJobWithoutToken();
				mockResponses({ status: 200, body: visitorBody }, { status: 400, body: '{}' });

				const error = await readBoardError(job, signal);

				expectNotReadable(error);
			});
		});

		describe('when an answer with status 200 is not JSON', () => {
			it('should throw an error that permits a new attempt', async () => {
				const { job, signal } = setupJobWithoutToken();
				mockResponses({ status: 200, body: visitorBody }, { status: 200, body: '<html>blocked</html>' });

				const error = await readBoardError(job, signal);

				expectTemporaryError(error);
			});
		});

		describe('when a request fails', () => {
			it('should throw an error without the link, the token and the answer', async () => {
				const { job, signal } = setupJobWithToken();
				mockResponses({ status: 200, body: visitorBody }, { status: 201, body: '' }, { status: 500, body: boardBody });

				const error = await readBoardError(job, signal);

				expect(error).toEqual(
					expect.objectContaining({
						message: expect.not.stringMatching(new RegExp(`${boardId}|${token}|${visitorId}|taskcards\\.de`)),
					})
				);
			});
		});

		describe('when the signal is aborted', () => {
			it('should throw before the first request', async () => {
				const abortController = new AbortController();
				const { job } = setupJobWithToken();
				abortController.abort();

				await expect(service.readBoard(job, abortController.signal)).rejects.toThrow();

				expect(httpClient.request).not.toHaveBeenCalled();
			});
		});
	});
});
