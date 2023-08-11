import { NotImplementedException } from '@nestjs/common';
import { ContentElementFactory } from './content-element.factory';
import { FileElement } from './file-element.do';
import { RichTextElement } from './rich-text-element.do';
import { SubmissionContainerElement } from './submission-container-element.do';
import { ContentElementType } from './types/content-elements.enum';

describe(ContentElementFactory.name, () => {
	describe('build', () => {
		const setup = () => {
			const contentElementFactory = new ContentElementFactory();

			return { contentElementFactory };
		};

		it('should return element of FILE', () => {
			const { contentElementFactory } = setup();

			const element = contentElementFactory.build(ContentElementType.FILE);

			expect(element).toBeInstanceOf(FileElement);
		});

		it('should return element of RICH_TEXT', () => {
			const { contentElementFactory } = setup();

			const element = contentElementFactory.build(ContentElementType.RICH_TEXT);

			expect(element).toBeInstanceOf(RichTextElement);
		});

		it('should return element of SUBMISSION_CONTAINER', () => {
			const { contentElementFactory } = setup();

			const element = contentElementFactory.build(ContentElementType.SUBMISSION_CONTAINER);

			expect(element).toBeInstanceOf(SubmissionContainerElement);
		});

		it('should throw NotImplementedException', () => {
			const { contentElementFactory } = setup();

			// @ts-expect-error check unknown type
			expect(() => contentElementFactory.build('UNKNOWN')).toThrow(NotImplementedException);
		});
	});
});
