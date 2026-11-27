import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import {
	type BoardImportJob,
	BoardImportJobLogReason,
	BoardImportJobRejectedError,
	BoardImportSourceHttpClientService,
	BoardImportSourceReaderRegistryService,
	type IntermediateBoard,
} from '@modules/board-import';
import { boardImportJobFactory } from '@modules/board-import/testing';
import { BOARD_IMPORT_TASKCARDS_SOURCE_TYPE } from '../../board-import-taskcards.constants';
import { readTaskcardsFixture } from '../../testing';
import { BoardImportTaskcardsReaderService } from './board-import-taskcards-reader.service';

describe(BoardImportTaskcardsReaderService.name, () => {
	let module: TestingModule;
	let service: BoardImportTaskcardsReaderService;
	let httpClient: DeepMocked<BoardImportSourceHttpClientService>;

	const boardId = '793bed21-a8ac-4a26-910e-2c3305ac6c0d';
	const boardTitle = 'Test Pinboard';
	const token = '0599256f-0bd0-498b-b231-1899dd79a644';
	const visitorId = '00000000-0000-4000-8000-000000000000';
	const visitorBody = readTaskcardsFixture('create-visitor.json');
	const boardBody = readTaskcardsFixture('board-pinboard.json');
	const notReadableBody = readTaskcardsFixture('board-not-readable.json');
	const graphqlUrl = 'https://www.taskcards.de/graphql';
	const accessUrl = `https://www.taskcards.de/api/boards/${boardId}/permissions/${token}/accesses`;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardImportTaskcardsReaderService,
				BoardImportSourceReaderRegistryService,
				{ provide: BoardImportSourceHttpClientService, useValue: createMock<BoardImportSourceHttpClientService>() },
			],
		}).compile();

		service = module.get(BoardImportTaskcardsReaderService);
		httpClient = module.get(BoardImportSourceHttpClientService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
		jest.useRealTimers();
	});

	describe('when the service is created', () => {
		it('should register itself as the reader of TaskCards', () => {
			const registry = module.get(BoardImportSourceReaderRegistryService);

			const result = registry.findByType(BOARD_IMPORT_TASKCARDS_SOURCE_TYPE);

			expect(result).toBe(service);
		});
	});

	const setupJob = (link: string) => {
		const job = boardImportJobFactory.build({ source: { type: BOARD_IMPORT_TASKCARDS_SOURCE_TYPE, link } });
		const { signal } = new AbortController();

		return { job, signal };
	};

	const setupJobWithToken = () => setupJob(`https://www.taskcards.de/#/board/${boardId}?token=${token}`);

	const setupJobWithoutToken = () => setupJob(`https://www.taskcards.de/#/board/${boardId}`);

	const mockResponses = (...responses: { status: number; body: string }[]): void => {
		responses.forEach((response) => httpClient.request.mockResolvedValueOnce(response));
	};

	const readBoardError = async (
		...args: Parameters<BoardImportTaskcardsReaderService['readBoard']>
	): Promise<unknown> => {
		const error: unknown = await service.readBoard(...args).catch((e: unknown) => e);

		return error;
	};

	const expectBoardOfFixture = (board: IntermediateBoard, job: BoardImportJob): void => {
		expect(board).toEqual(expect.objectContaining({ source: job.source, title: boardTitle }));
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

			it('should return the board as intermediate model', async () => {
				const { job, signal } = setup();

				const result = await service.readBoard(job, signal);

				expectBoardOfFixture(result, job);
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
					sourceType: BOARD_IMPORT_TASKCARDS_SOURCE_TYPE,
					signal,
				});
				expect(httpClient.request).toHaveBeenNthCalledWith(2, {
					method: 'POST',
					url: accessUrl,
					headers: { 'Content-Type': 'application/json', 'x-token': visitorId },
					body: JSON.stringify({ password: '' }),
					sourceType: BOARD_IMPORT_TASKCARDS_SOURCE_TYPE,
					signal,
				});
				expect(httpClient.request).toHaveBeenNthCalledWith(3, {
					method: 'POST',
					url: graphqlUrl,
					headers: { 'Content-Type': 'application/json', 'x-token': visitorId },
					body: expect.stringContaining(`"variables":{"id":"${boardId}"}`),
					sourceType: BOARD_IMPORT_TASKCARDS_SOURCE_TYPE,
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
			const setup = () => {
				const { job, signal } = setupJobWithoutToken();
				mockResponses({ status: 200, body: visitorBody }, { status: 200, body: boardBody });
				const requestCount = 2;

				return { job, signal, requestCount };
			};

			it('should read the board without the access call', async () => {
				const { job, signal, requestCount } = setup();

				const result = await service.readBoard(job, signal);

				expectBoardOfFixture(result, job);
				expect(httpClient.request).toHaveBeenCalledTimes(requestCount);
			});
		});

		describe('when the access is unlocked already', () => {
			const setup = () => {
				const { job, signal } = setupJobWithToken();
				mockResponses({ status: 200, body: visitorBody }, { status: 409, body: '' }, { status: 200, body: boardBody });

				return { job, signal };
			};

			it('should accept the status 409 and read the board', async () => {
				const { job, signal } = setup();

				const result = await service.readBoard(job, signal);

				expectBoardOfFixture(result, job);
			});
		});

		describe('when the source rejects the token of the link', () => {
			const setup = (status: number) => {
				const { job, signal } = setupJobWithToken();
				mockResponses(
					{ status: 200, body: visitorBody },
					{ status, body: '{"message":"Permission is not available"}' }
				);
				const requestCount = 2;

				return { job, signal, requestCount };
			};

			it.each([403, 404])('should reject the job for the status %s', async (status: number) => {
				const { job, signal, requestCount } = setup(status);

				const error = await readBoardError(job, signal);

				expectNotReadable(error);
				expect(httpClient.request).toHaveBeenCalledTimes(requestCount);
			});
		});

		describe('when the link contains no board id', () => {
			const setup = () => {
				const { job, signal } = setupJob('https://www.taskcards.de/#/dashboard');

				return { job, signal };
			};

			it('should reject the job without a request', async () => {
				const { job, signal } = setup();

				const error = await readBoardError(job, signal);

				expectNotReadable(error);
				expect(httpClient.request).not.toHaveBeenCalled();
			});
		});

		describe('when the visitor answer contains no id', () => {
			const setup = () => {
				const { job, signal } = setupJobWithoutToken();
				mockResponses({ status: 200, body: '{"data":{"createVisitor":null}}' });

				return { job, signal };
			};

			it('should throw an error that permits a new attempt', async () => {
				const { job, signal } = setup();

				const error = await readBoardError(job, signal);

				expectTemporaryError(error);
			});
		});

		describe('when the board is not readable for the visitor and the link has no token', () => {
			const setup = () => {
				const { job, signal } = setupJobWithoutToken();
				mockResponses({ status: 200, body: visitorBody }, { status: 200, body: notReadableBody });
				const requestCount = 2;

				return { job, signal, requestCount };
			};

			it('should reject the job after one board query', async () => {
				const { job, signal, requestCount } = setup();

				const error = await readBoardError(job, signal);

				expectNotReadable(error);
				expect(httpClient.request).toHaveBeenCalledTimes(requestCount);
			});
		});

		describe('when the board query fails first after the access call', () => {
			const setup = () => {
				jest.useFakeTimers();
				const { job, signal } = setupJobWithToken();
				mockResponses(
					{ status: 200, body: visitorBody },
					{ status: 201, body: '' },
					{ status: 200, body: notReadableBody },
					{ status: 200, body: notReadableBody },
					{ status: 200, body: boardBody }
				);
				const retryDelaysInMs = 300 + 800;
				const requestCount = 5;

				return { job, signal, retryDelaysInMs, requestCount };
			};

			it('should try the board query again and return the board', async () => {
				const { job, signal, retryDelaysInMs, requestCount } = setup();

				const promise = service.readBoard(job, signal);
				await jest.advanceTimersByTimeAsync(retryDelaysInMs);
				const result = await promise;

				expectBoardOfFixture(result, job);
				expect(httpClient.request).toHaveBeenCalledTimes(requestCount);
			});
		});

		describe('when the board stays not readable after the access call', () => {
			const setup = () => {
				jest.useFakeTimers();
				const { job, signal } = setupJobWithToken();
				mockResponses(
					{ status: 200, body: visitorBody },
					{ status: 201, body: '' },
					{ status: 200, body: notReadableBody },
					{ status: 200, body: notReadableBody },
					{ status: 200, body: notReadableBody }
				);
				const retryDelaysInMs = 300 + 800;
				const requestCount = 5;

				return { job, signal, retryDelaysInMs, requestCount };
			};

			it('should reject the job after three board queries', async () => {
				const { job, signal, retryDelaysInMs, requestCount } = setup();

				const promise = readBoardError(job, signal);
				await jest.advanceTimersByTimeAsync(retryDelaysInMs);
				const error = await promise;

				expectNotReadable(error);
				expect(httpClient.request).toHaveBeenCalledTimes(requestCount);
			});
		});

		describe('when the board query gives another GraphQL error', () => {
			const setup = () => {
				const { job, signal } = setupJobWithToken();
				const body = JSON.stringify({
					errors: [{ message: 'Syntax Error', extensions: { code: 'GRAPHQL_PARSE_FAILED' } }],
				});
				mockResponses({ status: 200, body: visitorBody }, { status: 201, body: '' }, { status: 200, body });
				const requestCount = 3;

				return { job, signal, requestCount };
			};

			it('should reject the job without a second board query', async () => {
				const { job, signal, requestCount } = setup();

				const error = await readBoardError(job, signal);

				expectNotReadable(error);
				expect(httpClient.request).toHaveBeenCalledTimes(requestCount);
			});
		});

		describe('when the board query gives an unknown GraphQL error', () => {
			const setup = () => {
				const { job, signal } = setupJobWithoutToken();
				const body = JSON.stringify({
					errors: [{ message: 'Internal error', extensions: { code: 'INTERNAL_SERVER_ERROR' } }],
					data: null,
				});
				mockResponses({ status: 200, body: visitorBody }, { status: 200, body });

				return { job, signal };
			};

			it('should throw an error that permits a new attempt', async () => {
				const { job, signal } = setup();

				const error = await readBoardError(job, signal);

				expectTemporaryError(error);
			});
		});

		describe('when the board query gives the board and an error of a nested field', () => {
			const setup = () => {
				const { job, signal } = setupJobWithoutToken();
				const body = JSON.stringify({
					errors: [{ message: 'Link failed', path: ['board', 'cards', 0, 'attachments', 0, 'downloadLink'] }],
					data: { board: { id: boardId, name: boardTitle, type: 0, cards: [] } },
				});
				mockResponses({ status: 200, body: visitorBody }, { status: 200, body });

				return { job, signal };
			};

			it('should return the board', async () => {
				const { job, signal } = setup();

				const result = await service.readBoard(job, signal);

				expectBoardOfFixture(result, job);
			});
		});

		describe.each([
			['the lists', ['board', 'lists']],
			['the board type', ['board', 'type']],
			['a field of an attachment that is not a link', ['board', 'cards', 0, 'attachments', 0, 'filename']],
		])('when the board query gives the board and an error of %s', (_, path) => {
			const setup = () => {
				const { job, signal } = setupJobWithoutToken();
				const body = JSON.stringify({
					errors: [{ message: 'Field failed', path }],
					data: { board: { id: boardId, name: boardTitle, type: null, lists: null, cards: [] } },
				});
				mockResponses({ status: 200, body: visitorBody }, { status: 200, body });

				return { job, signal };
			};

			it('should throw an error that permits a new attempt', async () => {
				const { job, signal } = setup();

				const error = await readBoardError(job, signal);

				expectTemporaryError(error);
			});
		});

		describe('when the board query gives the board and an error without a path', () => {
			const setup = () => {
				const { job, signal } = setupJobWithoutToken();
				const body = JSON.stringify({
					errors: [{ message: 'Internal error' }],
					data: { board: { id: boardId, name: boardTitle, type: 0, cards: [] } },
				});
				mockResponses({ status: 200, body: visitorBody }, { status: 200, body });

				return { job, signal };
			};

			it('should throw an error that permits a new attempt', async () => {
				const { job, signal } = setup();

				const error = await readBoardError(job, signal);

				expectTemporaryError(error);
			});
		});

		describe('when the board is not a pinboard', () => {
			const setup = () => {
				const { job, signal } = setupJobWithoutToken();
				const body = JSON.stringify({ data: { board: { id: boardId, name: boardTitle, type: 1, cards: [] } } });
				mockResponses({ status: 200, body: visitorBody }, { status: 200, body });

				return { job, signal };
			};

			it('should reject the job with the reason that the board type is not supported', async () => {
				const { job, signal } = setup();

				const error = await readBoardError(job, signal);

				expect(error).toBeInstanceOf(BoardImportJobRejectedError);
				expect(error).toHaveProperty('reason', BoardImportJobLogReason.SOURCE_BOARD_TYPE_NOT_SUPPORTED);
			});
		});

		describe('when the signal is aborted during the wait for the next board query', () => {
			const setup = () => {
				jest.useFakeTimers();
				const { job } = setupJobWithToken();
				const controller = new AbortController();
				mockResponses(
					{ status: 200, body: visitorBody },
					{ status: 201, body: '' },
					{ status: 200, body: notReadableBody }
				);
				const requestCount = 3;

				return { job, controller, requestCount };
			};

			it('should stop the wait and send no further request', async () => {
				const { job, controller, requestCount } = setup();

				const promise = readBoardError(job, controller.signal);
				await jest.advanceTimersByTimeAsync(0);
				controller.abort();
				const error = await promise;

				expect(error).toHaveProperty('name', 'AbortError');
				expect(httpClient.request).toHaveBeenCalledTimes(requestCount);
			});
		});

		describe('when the board query gives no board and no error', () => {
			const setup = () => {
				const { job, signal } = setupJobWithoutToken();
				mockResponses({ status: 200, body: visitorBody }, { status: 200, body: '{"data":{"board":null}}' });

				return { job, signal };
			};

			it('should reject the job', async () => {
				const { job, signal } = setup();

				const error = await readBoardError(job, signal);

				expectNotReadable(error);
			});
		});

		describe('when the client fails with an error that permits a new attempt', () => {
			const setup = () => {
				const { job, signal } = setupJobWithToken();
				const clientError = new Error('Request to the source failed');
				mockResponses({ status: 200, body: visitorBody });
				httpClient.request.mockRejectedValueOnce(clientError);

				return { job, signal, clientError };
			};

			it('should pass the error', async () => {
				const { job, signal, clientError } = setup();

				const error = await readBoardError(job, signal);

				expect(error).toBe(clientError);
			});
		});

		describe('when the board query answers with status 400', () => {
			const setup = () => {
				const { job, signal } = setupJobWithoutToken();
				mockResponses({ status: 200, body: visitorBody }, { status: 400, body: '{}' });

				return { job, signal };
			};

			it('should reject the job', async () => {
				const { job, signal } = setup();

				const error = await readBoardError(job, signal);

				expectNotReadable(error);
			});
		});

		describe('when an answer with status 200 is not JSON', () => {
			const setup = () => {
				const { job, signal } = setupJobWithoutToken();
				mockResponses({ status: 200, body: visitorBody }, { status: 200, body: '<html>blocked</html>' });

				return { job, signal };
			};

			it('should throw an error that permits a new attempt', async () => {
				const { job, signal } = setup();

				const error = await readBoardError(job, signal);

				expectTemporaryError(error);
			});
		});

		describe('when an answer with status 200 is JSON but not an object', () => {
			const setup = (body: string) => {
				const { job, signal } = setupJobWithoutToken();
				mockResponses({ status: 200, body: visitorBody }, { status: 200, body });

				return { job, signal };
			};

			it.each(['null', '[]'])('should throw an error that permits a new attempt for %s', async (body: string) => {
				const { job, signal } = setup(body);

				const error = await readBoardError(job, signal);

				expectTemporaryError(error);
			});
		});

		describe('when the signal is aborted', () => {
			const setup = () => {
				const abortController = new AbortController();
				const { job } = setupJobWithToken();
				abortController.abort();

				return { job, signal: abortController.signal };
			};

			it('should throw before the first request', async () => {
				const { job, signal } = setup();

				await expect(service.readBoard(job, signal)).rejects.toThrow();

				expect(httpClient.request).not.toHaveBeenCalled();
			});
		});
	});
});
