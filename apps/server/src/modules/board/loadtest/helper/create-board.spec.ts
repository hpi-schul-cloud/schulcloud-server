import { createBoard } from './create-board';

describe('createBoards', () => {
	describe('createBoard', () => {
		const apiBaseUrl = 'http://example.com';
		const courseId = 'course123';
		const mockFetch = jest.fn();

		beforeEach(() => {
			global.fetch = mockFetch;
		});

		afterEach(() => {
			jest.clearAllMocks();
		});

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

			await expect(createBoard(apiBaseUrl, token, courseId)).rejects.toThrow(
				'Failed to create board: 400 - check token and target in env-variables'
			);
		});
	});
});
