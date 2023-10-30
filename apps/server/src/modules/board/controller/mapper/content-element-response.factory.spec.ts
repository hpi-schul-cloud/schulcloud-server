import { NotImplementedException } from '@nestjs/common';
import { fileElementFactory } from '@shared/testing/factory/domainobject/board/file-element.do.factory';
import { linkElementFactory } from '@shared/testing/factory/domainobject/board/link-element.do.factory';
import { richTextElementFactory } from '@shared/testing/factory/domainobject/board/rich-text-element.do.factory';
import { submissionContainerElementFactory } from '@shared/testing/factory/domainobject/board/submission-container-element.do.factory';
import { FileElementResponse } from '../dto/element/file-element.response';
import { LinkElementResponse } from '../dto/element/link-element.response';
import { RichTextElementResponse } from '../dto/element/rich-text-element.response';
import { SubmissionContainerElementResponse } from '../dto/element/submission-container-element.response';
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
