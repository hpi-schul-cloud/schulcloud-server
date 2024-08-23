import { getRandomLink, getRandomRichContentBody, getRandomCardTitle } from './randomData';

describe('randomData', () => {
	describe('getRandomLink', () => {
		it('should return a valid link', () => {
			const randomLink = getRandomLink();

			expect(typeof randomLink.title).toBe('string');
			expect(randomLink.title).toBeDefined();
			expect(randomLink.title?.length).toBeGreaterThan(3);
			expect(randomLink.url).toBeDefined();
			expect(randomLink.url).toEqual(expect.stringContaining('http'));
		});
	});

	describe('getRandomRichContentBody', () => {
		it('should return a valid text', () => {
			const randomText = getRandomRichContentBody();

			expect(randomText).toBeDefined();
			expect(randomText.length).toBeGreaterThan(20);
		});
	});

	describe('getRandomCardTitle', () => {
		it('should return a valid title', () => {
			const randomTitle = getRandomCardTitle();

			expect(randomTitle).toBeDefined();
			expect(randomTitle.length).toBeGreaterThan(3);
		});
	});
});
