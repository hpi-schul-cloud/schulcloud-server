import { NotImplementedException } from '@nestjs/common';
import {
	deletedElementFactory,
	drawingElementFactory,
	fileElementFactory,
	fileFolderElementFactory,
	linkElementFactory,
	richTextElementFactory,
	submissionContainerElementFactory,
	videoConferenceElementFactory,
} from '../../testing';
import {
	DeletedElementResponse,
	DrawingElementResponse,
	FileElementResponse,
	FileFolderElementResponse,
	LinkElementResponse,
	RichTextElementResponse,
	SubmissionContainerElementResponse,
	VideoConferenceElementResponse,
} from '../dto';
import { ContentElementResponseFactory } from './content-element-response.factory';

describe(ContentElementResponseFactory.name, () => {
	it('should return instance of FileElementResponse', () => {
		const fileElement = fileElementFactory.build();

		const result = ContentElementResponseFactory.mapToResponse(fileElement);

		expect(result).toBeInstanceOf(FileElementResponse);
	});

	it('should return instance of FileFolderElementResponse', () => {
		const fileFolderElement = fileFolderElementFactory.build();

		const result = ContentElementResponseFactory.mapToResponse(fileFolderElement);

		expect(result).toBeInstanceOf(FileFolderElementResponse);
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

	it('should return instance of DrawingElementResponse', () => {
		const drawingElement = drawingElementFactory.build();

		const result = ContentElementResponseFactory.mapToResponse(drawingElement);

		expect(result).toBeInstanceOf(DrawingElementResponse);
	});

	it('should return instance of SubmissionContainerElementResponse', () => {
		const submissionContainerElement = submissionContainerElementFactory.build();

		const result = ContentElementResponseFactory.mapToResponse(submissionContainerElement);

		expect(result).toBeInstanceOf(SubmissionContainerElementResponse);
	});

	it('should return instance of DeletedElementResponse', () => {
		const drawingElement = deletedElementFactory.build();

		const result = ContentElementResponseFactory.mapToResponse(drawingElement);

		expect(result).toBeInstanceOf(DeletedElementResponse);
	});

	it('should return instance of VideoConferenceElementResponse', () => {
		const videoConferenceElement = videoConferenceElementFactory.build();

		const result = ContentElementResponseFactory.mapToResponse(videoConferenceElement);

		expect(result).toBeInstanceOf(VideoConferenceElementResponse);
	});

	it('should throw NotImplementedException', () => {
		// @ts-expect-error check unknown type
		expect(() => ContentElementResponseFactory.mapToResponse('UNKNOWN')).toThrow(NotImplementedException);
	});
});
