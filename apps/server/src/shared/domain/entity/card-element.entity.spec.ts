import { setupEntities } from '@shared/testing';
import { CardElementType, RichTextCardElement } from '.';
import { InputFormat, RichText } from '../types';

describe('RichTextCardElementEntity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		it('should have correct type', () => {
			const richText = new RichText({ content: 'richText example', type: InputFormat.RICH_TEXT_CK5 });
			const richTextCardElement = new RichTextCardElement(richText);

			expect(richTextCardElement.cardElementType).toEqual(CardElementType.RichText);
		});
	});
});
