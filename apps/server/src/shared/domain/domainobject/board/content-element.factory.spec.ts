import { NotImplementedException } from '@nestjs/common';
import { ContentElementFactory } from './content-element.factory';
import { FileElement } from './file-element.do';
import { TextElement } from './text-element.do';
import { ContentElementType } from './types/content-elements.enum';

describe(ContentElementFactory.name, () => {
	const setup = () => {
		const contentElementProvider = new ContentElementFactory();

		return { contentElementProvider };
	};

	it('should return element of TEXT', () => {
		const { contentElementProvider } = setup();

		const element = contentElementProvider.getElement(ContentElementType.TEXT);

		expect(element).toBeInstanceOf(TextElement);
	});

	it('should return element of FILE', () => {
		const { contentElementProvider } = setup();

		const element = contentElementProvider.getElement(ContentElementType.FILE);

		expect(element).toBeInstanceOf(FileElement);
	});

	it('should throw NotImplementedException', () => {
		const { contentElementProvider } = setup();

		// @ts-expect-error check unknown type
		expect(() => contentElementProvider.getElement('UNKNOWN')).toThrow(NotImplementedException);
	});
});
