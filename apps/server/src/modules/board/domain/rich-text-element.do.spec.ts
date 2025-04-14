import { InputFormat } from '@shared/domain/types';
import { richTextElementFactory } from '../testing';
import { RichTextElement, isRichTextElement } from './rich-text-element.do';

describe('RichTextElement', () => {
	let richTextElement: RichTextElement;

	beforeEach(() => {
		richTextElement = richTextElementFactory.build({
			text: 'Test text',
			inputFormat: InputFormat.RICH_TEXT_CK5,
		});
	});

	it('should be instance of RichTextElement', () => {
		expect(isRichTextElement(richTextElement)).toBe(true);
	});

	it('should not be instance of RichTextElement', () => {
		expect(isRichTextElement({})).toBe(false);
	});

	it('should return text', () => {
		expect(richTextElement.text).toBe('Test text');
	});

	it('should set text', () => {
		richTextElement.text = 'New text';
		expect(richTextElement.text).toBe('New text');
	});

	it('should return inputFormat', () => {
		expect(richTextElement.inputFormat).toBe(InputFormat.RICH_TEXT_CK5);
	});

	it('should set inputFormat', () => {
		richTextElement.inputFormat = InputFormat.PLAIN_TEXT;
		expect(richTextElement.inputFormat).toBe(InputFormat.PLAIN_TEXT);
	});

	it('should not have child', () => {
		expect(richTextElement.canHaveChild()).toBe(false);
	});
});
