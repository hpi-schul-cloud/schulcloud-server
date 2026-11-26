import { parseTaskcardsLink } from './board-import-taskcards-link';

describe('parseTaskcardsLink', () => {
	const boardId = '793bed21-a8ac-4a26-910e-2c3305ac6c0d';
	const token = '0599256f-0bd0-498b-b231-1899dd79a644';

	describe('when the link contains a board id', () => {
		it.each([
			{
				link: `https://www.taskcards.de/#/board/${boardId}?token=${token}`,
				expected: { boardId, token, baseUrl: 'https://www.taskcards.de' },
			},
			{
				link: `https://www.taskcards.de/#/board/${boardId}`,
				expected: { boardId, token: undefined, baseUrl: 'https://www.taskcards.de' },
			},
			{
				link: `https://www.taskcards.de/board/${boardId}?token=${token}`,
				expected: { boardId, token, baseUrl: 'https://www.taskcards.de' },
			},
			{
				link: `https://www.taskcards.de/#/board/${boardId}/view?token=${token}`,
				expected: { boardId, token, baseUrl: 'https://www.taskcards.de' },
			},
			{
				link: `https://www.taskcards.de/#/board/${boardId}?token=`,
				expected: { boardId, token: undefined, baseUrl: 'https://www.taskcards.de' },
			},
			{
				link: `https://taskcards.de/#/board/${boardId}`,
				expected: { boardId, token: undefined, baseUrl: 'https://www.taskcards.de' },
			},
			{
				link: `https://bra.taskcards.app/#/board/${boardId}`,
				expected: { boardId, token: undefined, baseUrl: 'https://bra.taskcards.app' },
			},
			{
				link: `https://www.taskcards.de/#/board/${boardId}?ref=a?b&token=${token}`,
				expected: { boardId, token, baseUrl: 'https://www.taskcards.de' },
			},
		])('should return the parts of "$link"', ({ link, expected }) => {
			const result = parseTaskcardsLink(link);

			expect(result).toEqual(expected);
		});
	});

	describe('when the link contains no board id', () => {
		it.each([
			'https://www.taskcards.de/',
			'https://www.taskcards.de/#/board/not-a-uuid',
			'https://www.taskcards.de/#/dashboard',
			`https://www.taskcards.de/#/board/${boardId}x`,
			'not a link',
		])('should return undefined for "%s"', (link: string) => {
			const result = parseTaskcardsLink(link);

			expect(result).toBeUndefined();
		});
	});

	describe('when the token of the link can change the path of a request', () => {
		it.each([
			`https://www.taskcards.de/#/board/${boardId}?token=..`,
			`https://www.taskcards.de/#/board/${boardId}?token=.`,
			`https://www.taskcards.de/board/${boardId}?token=a%2Fb`,
		])('should return undefined for "%s"', (link: string) => {
			const result = parseTaskcardsLink(link);

			expect(result).toBeUndefined();
		});
	});
});
