import { AbstractUrlHandler } from './abstract-url-handler';

class DummyHandler extends AbstractUrlHandler {
	patterns: RegExp[] = [/\/dummy\/([0-9a-z]+)$/i];

	extractId(url: string): string | undefined {
		return super.extractId(url);
	}
}

describe(AbstractUrlHandler.name, () => {
	const setup = () => {
		const id = 'af322312feae';
		const url = `https://localhost/dummy/${id}`;
		const invalidUrl = `https://localhost/wrong/${id}`;
		const handler = new DummyHandler();
		return { id, url, invalidUrl, handler };
	};

	describe('extractId', () => {
		describe('when no id was extracted', () => {
			it('should return undefined', () => {
				const { invalidUrl, handler } = setup();

				const result = handler.extractId(invalidUrl);

				expect(result).toBeUndefined();
			});
		});
	});

	describe('doesUrlMatch', () => {
		it('should be true for valid urls', () => {
			const { url, handler } = setup();

			const result = handler.doesUrlMatch(url);

			expect(result).toBe(true);
		});

		it('should be false for invalid urls', () => {
			const { invalidUrl, handler } = setup();

			const result = handler.doesUrlMatch(invalidUrl);

			expect(result).toBe(false);
		});
	});

	describe('getDefaultMetaData', () => {
		it('should return meta data of type unknown', () => {
			const { url, handler } = setup();

			const result = handler.getDefaultMetaData(url);

			expect(result).toEqual(expect.objectContaining({ type: 'unknown', url }));
		});
	});
});
