/* eslint-disable no-process-env */
import { getToken, createBoard, createBoards } from './createBoards';

describe('createBoards', () => {
	describe('getToken', () => {
		const originalEnv = process.env;

		beforeEach(() => {
			jest.resetModules();
			process.env = { ...originalEnv };
		});

		afterAll(() => {
			process.env = originalEnv;
		});

		it('should throw an error if token is not found in environment', () => {
			delete process.env.token;
			expect(() => getToken()).toThrow('No token found in environment');
		});

		it('should return the token if found in environment', () => {
			process.env.token = 'test-token';
			expect(getToken()).toBe('test-token');
		});
	});

	describe('createBoard', () => {
		const apiBaseUrl = 'http://example.com';
		const courseId = 'course123';
		const mockFetch = jest.fn();

		beforeEach(() => {
			global.fetch = mockFetch;
			process.env.token = 'test-token';
		});

		afterEach(() => {
			jest.clearAllMocks();
		});

		it('should create a board and return its id', async () => {
			const boardId = 'board123';
			mockFetch.mockResolvedValueOnce({
				status: 201,
				json: () => {
					return { id: boardId };
				},
			});

			const result = await createBoard(apiBaseUrl, courseId);

			expect(result).toBe(boardId);
			expect(mockFetch).toHaveBeenCalledWith(
				`${apiBaseUrl}/api/v3/boards`,
				expect.objectContaining({
					method: 'POST',
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					headers: expect.objectContaining({
						Authorization: 'Bearer test-token',
					}),
				})
			);
		});

		it('should throw an error if the board creation fails', async () => {
			mockFetch.mockResolvedValueOnce({
				status: 400,
				json: () => {
					return {};
				},
			});

			await expect(createBoard(apiBaseUrl, courseId)).rejects.toThrow(
				'Failed to create board: 400 - check token and target in env-variables'
			);
		});
	});

	describe('createBoards', () => {
		const apiBaseUrl = 'http://example.com';
		const courseId = 'course123';
		const mockFetch = jest.fn();

		beforeEach(() => {
			global.fetch = mockFetch;
			process.env.token = 'test-token';
		});

		afterEach(() => {
			jest.clearAllMocks();
		});

		it('should create multiple boards and return their ids', async () => {
			const boardIds = ['board1', 'board2', 'board3'];
			mockFetch.mockResolvedValue({
				status: 201,
				json: () => {
					return { id: boardIds.shift() };
				},
			});

			const result = await createBoards(apiBaseUrl, courseId, 3);

			expect(result).toEqual(['board1', 'board2', 'board3']);
			expect(mockFetch).toHaveBeenCalledTimes(3);
		});

		it('should handle errors when creating multiple boards', async () => {
			mockFetch
				.mockResolvedValueOnce({
					status: 201,
					json: () => {
						return { id: 'board1' };
					},
				})
				.mockResolvedValueOnce({
					status: 400,
					json: () => {
						return {};
					},
				})
				.mockResolvedValueOnce({
					status: 201,
					json: () => {
						return { id: 'board3' };
					},
				});

			await expect(createBoards(apiBaseUrl, courseId, 3)).rejects.toThrow(
				'Failed to create board: 400 - check token and target in env-variables'
			);
		});
	});
});
