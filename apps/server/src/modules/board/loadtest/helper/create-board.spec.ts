import { createBoard, createBoardsResilient } from './create-board';

describe('createBoards', () => {
	const mockFetch = jest.fn();

	beforeEach(() => {
		global.fetch = mockFetch;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('createBoard', () => {
		const apiBaseUrl = 'http://example.com';
		const courseId = 'course123';

		it('should create a board and return its id', async () => {
			const boardId = 'board123';
			const token = 'test-token';
			mockFetch.mockResolvedValueOnce({
				status: 201,
				json: () => {
					return { id: boardId };
				},
			});

			const result = await createBoard(apiBaseUrl, token, courseId);

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
			const token = 'test-token';
			mockFetch.mockResolvedValueOnce({
				status: 400,
				json: () => {
					return {};
				},
			});

			await expect(createBoard(apiBaseUrl, token, courseId)).rejects.toThrow();
		});
	});

	describe('createBoardsResilient', () => {
		it('should create the correct amount of boards', async () => {
			mockFetch.mockResolvedValue({
				status: 201,
				json: () => {
					return { id: `board${Math.ceil(Math.random() * 1000)}` };
				},
			});

			await createBoardsResilient('http://example.com', 'test-token', 'course123', 5);

			expect(mockFetch).toHaveBeenCalledTimes(5);
		});

		it('should retry on error and in the end return the possible amount of boardIds', async () => {
			mockFetch.mockResolvedValueOnce({
				status: 201,
				json: () => {
					return { id: `board${Math.ceil(Math.random() * 1000)}` };
				},
			});

			mockFetch.mockResolvedValue({
				status: 404,
				json: () => {
					return {};
				},
			});

			const boardIds = await createBoardsResilient('http://example.com', 'test-token', 'course123', 5);

			expect(mockFetch).toHaveBeenCalledTimes(11);
			expect(boardIds).toHaveLength(1);
		});

		it('should throw an error if the token is unauthorized', async () => {
			mockFetch.mockResolvedValue({
				status: 401,
				json: () => {
					return {};
				},
			});

			await expect(createBoardsResilient('http://example.com', 'test-token', 'course123', 5)).rejects.toThrow();
		});
	});
});
