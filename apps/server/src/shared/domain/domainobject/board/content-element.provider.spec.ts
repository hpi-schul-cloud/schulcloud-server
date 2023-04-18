import { NotImplementedException } from '@nestjs/common';
import { ContentElementType } from '@src/modules/board/types';
import { ContentElementProvider } from './content-element.provider';
import { FileElement } from './file-element.do';
import { TextElement } from './text-element.do';

describe(ContentElementProvider.name, () => {
	const setup = () => {
		const contentElementProvider = new ContentElementProvider();

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
