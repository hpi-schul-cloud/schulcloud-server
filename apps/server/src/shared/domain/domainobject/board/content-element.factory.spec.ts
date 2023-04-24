import { NotImplementedException } from '@nestjs/common';
import { ContentElementFactory } from './content-element.factory';
import { FileElement } from './file-element.do';
import { TextElement } from './text-element.do';
import { ContentElementType } from './types/content-elements.enum';

describe(ContentElementFactory.name, () => {
	const setup = () => {
		const contentElementFactory = new ContentElementFactory();

		return { contentElementFactory };
	};

	it('should return element of TEXT', () => {
		const { contentElementFactory } = setup();

		const element = contentElementFactory.build(ContentElementType.TEXT);

		expect(element).toBeInstanceOf(TextElement);
	});

	it('should return element of FILE', () => {
		const { contentElementFactory } = setup();

		const element = contentElementFactory.build(ContentElementType.FILE);

		expect(element).toBeInstanceOf(FileElement);
	});

	it('should throw NotImplementedException', () => {
		const { contentElementFactory } = setup();

		// @ts-expect-error check unknown type
		expect(() => contentElementFactory.build('UNKNOWN')).toThrow(NotImplementedException);
	});
});
