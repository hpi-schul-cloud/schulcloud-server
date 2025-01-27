import { basename } from 'node:path';
import { MetaData, MetaDataEntityType } from '../../types';
import { AbstractUrlHandler } from './abstract-url-handler';

class DummyHandler extends AbstractUrlHandler {
	patterns: RegExp[] = [/\/dummy\/([0-9a-z]+)$/i];

	extractId(url: URL): string | undefined {
		return super.extractId(url);
	}
}

describe(AbstractUrlHandler.name, () => {
	const setup = () => {
		const id = 'af322312feae';
		const url = new URL(`https://localhost/dummy/${id}`);
		const invalidUrl = new URL(`https://localhost/wrong/${id}`);
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
		describe('when required fields are undefined', () => {
			it('should return meta data with defaults', () => {
				const { url, handler } = setup();

				const result = handler.getDefaultMetaData(url, {
					type: undefined,
					url: undefined,
					title: undefined,
					description: undefined,
				});

				expect(result).toEqual<MetaData>({
					type: MetaDataEntityType.UNKNOWN,
					url: url.toString(),
					title: basename(url.pathname),
					description: '',
				});
			});
		});

		describe('when partial overwrites the defaults', () => {
			it('should return meta data with overwrites', () => {
				const { url, handler } = setup();

				const result = handler.getDefaultMetaData(url, {
					type: MetaDataEntityType.BOARD,
					url: 'url',
					title: 'title',
					description: 'description',
					originalImageUrl: 'originalImageUrl',
				});

				expect(result).toEqual<MetaData>({
					type: MetaDataEntityType.BOARD,
					url: 'url',
					title: 'title',
					description: 'description',
					originalImageUrl: 'originalImageUrl',
				});
			});
		});
	});
});
