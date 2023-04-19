import { NotImplementedException } from '@nestjs/common';
import { fileElementFactory, textElementFactory } from '@shared/testing';
import { FileElementResponse, TextElementResponse } from '../dto';
import { ContentElementResponseBuilder } from './content-element-response.builder';

describe(ContentElementResponseBuilder.name, () => {
	const setup = () => {
		const textElement = textElementFactory.build();
		const fileElement = fileElementFactory.build();

		return { textElement, fileElement };
	};

	it('should return instance of TextElementResponse', () => {
		const { textElement } = setup();

		const result = ContentElementResponseBuilder.mapToResponse(textElement);

		expect(result).toBeInstanceOf(TextElementResponse);
	});

	it('should return instance of FileElementResponse', () => {
		const { fileElement } = setup();

		const result = ContentElementResponseBuilder.mapToResponse(fileElement);

		expect(result).toBeInstanceOf(FileElementResponse);
	});

	it('should throw NotImplementedException', () => {
		// @ts-expect-error check unknown type
		expect(() => ContentElementResponseBuilder.mapToResponse('UNKNOWN')).toThrow(NotImplementedException);
	});
});
