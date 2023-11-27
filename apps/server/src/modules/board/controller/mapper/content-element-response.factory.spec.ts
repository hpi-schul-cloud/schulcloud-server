import { NotImplementedException } from '@nestjs/common';
import {
	fileElementFactory,
	linkElementFactory,
	richTextElementFactory,
	submissionContainerElementFactory,
} from '@shared/testing';
import {
	FileElementResponse,
	LinkElementResponse,
	RichTextElementResponse,
	SubmissionContainerElementResponse,
} from '../dto';
import { ContentElementResponseFactory } from './content-element-response.factory';

describe(ContentElementResponseFactory.name, () => {
	it('should return instance of FileElementResponse', () => {
		const fileElement = fileElementFactory.build();

		const result = ContentElementResponseFactory.mapToResponse(fileElement);

		expect(result).toBeInstanceOf(FileElementResponse);
	});

	it('should return instance of LinkElementResponse', () => {
		const linkElement = linkElementFactory.build();
		const result = ContentElementResponseFactory.mapToResponse(linkElement);

		expect(result).toBeInstanceOf(LinkElementResponse);
	});

	it('should return instance of RichTextElementResponse', () => {
		const richTextElement = richTextElementFactory.build();

		const result = ContentElementResponseFactory.mapToResponse(richTextElement);

		expect(result).toBeInstanceOf(RichTextElementResponse);
	});

	it('should return instance of SubmissionContainerElementResponse', () => {
		const submissionContainerElement = submissionContainerElementFactory.build();

		const result = ContentElementResponseFactory.mapToResponse(submissionContainerElement);

		expect(result).toBeInstanceOf(SubmissionContainerElementResponse);
	});

	it('should throw NotImplementedException', () => {
		// @ts-expect-error check unknown type
		expect(() => ContentElementResponseFactory.mapToResponse('UNKNOWN')).toThrow(NotImplementedException);
	});
});
