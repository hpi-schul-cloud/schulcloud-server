import { NotImplementedException } from '@nestjs/common';
import { fileElementFactory, richTextElementFactory } from '@shared/testing';
import { FileElementResponse, RichTextElementResponse } from '../dto';
import { ContentElementResponseFactory } from './content-element-response.factory';

describe(ContentElementResponseFactory.name, () => {
	const setup = () => {
		const richTextElement = richTextElementFactory.build();
		const fileElement = fileElementFactory.build();

		return { richTextElement, fileElement };
	};

	it('should return instance of RichTextElementResponse', () => {
		const { richTextElement } = setup();

		const result = ContentElementResponseFactory.mapToResponse(richTextElement);

		expect(result).toBeInstanceOf(RichTextElementResponse);
	});

	it('should return instance of FileElementResponse', () => {
		const { fileElement } = setup();

		const result = ContentElementResponseFactory.mapToResponse(fileElement);

		expect(result).toBeInstanceOf(FileElementResponse);
	});

	it('should throw NotImplementedException', () => {
		// @ts-expect-error check unknown type
		expect(() => ContentElementResponseFactory.mapToResponse('UNKNOWN')).toThrow(NotImplementedException);
	});
});
