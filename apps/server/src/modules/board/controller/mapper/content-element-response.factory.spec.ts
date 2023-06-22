import { NotImplementedException } from '@nestjs/common';
import { fileElementFactory, richTextElementFactory, submissionContainerElementFactory } from '@shared/testing';
import { FileElementResponse, RichTextElementResponse, SubmissionContainerElementResponse } from '../dto';
import { ContentElementResponseFactory } from './content-element-response.factory';

describe(ContentElementResponseFactory.name, () => {
	const setup = () => {
		const fileElement = fileElementFactory.build();
		const richTextElement = richTextElementFactory.build();
		const taskElement = submissionContainerElementFactory.build();

		return { fileElement, richTextElement, taskElement };
	};

	it('should return instance of FileElementResponse', () => {
		const { fileElement } = setup();

		const result = ContentElementResponseFactory.mapToResponse(fileElement);

		expect(result).toBeInstanceOf(FileElementResponse);
	});

	it('should return instance of RichTextElementResponse', () => {
		const { richTextElement } = setup();

		const result = ContentElementResponseFactory.mapToResponse(richTextElement);

		expect(result).toBeInstanceOf(RichTextElementResponse);
	});

	it('should return instance of TaskElementResponse', () => {
		const { taskElement } = setup();

		const result = ContentElementResponseFactory.mapToResponse(taskElement);

		expect(result).toBeInstanceOf(SubmissionContainerElementResponse);
	});

	it('should throw NotImplementedException', () => {
		// @ts-expect-error check unknown type
		expect(() => ContentElementResponseFactory.mapToResponse('UNKNOWN')).toThrow(NotImplementedException);
	});
});
