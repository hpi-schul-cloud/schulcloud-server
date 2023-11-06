import { ExternalToolElementResponse } from './external-tool-element.response';
import { DrawingElementResponse } from '@src/modules/board/controller/dto/element/drawing-element.response';
import { FileElementResponse } from './file-element.response';
import { LinkElementResponse } from './link-element.response';
import { RichTextElementResponse } from './rich-text-element.response';
import { SubmissionContainerElementResponse } from './submission-container-element.response';

export type AnyContentElementResponse =
	| FileElementResponse
	| LinkElementResponse
	| RichTextElementResponse
	| SubmissionContainerElementResponse
	| ExternalToolElementResponse
	| DrawingElementResponse;

export const isFileElementResponse = (element: AnyContentElementResponse): element is FileElementResponse =>
	element instanceof FileElementResponse;

export const isRichTextElementResponse = (element: AnyContentElementResponse): element is RichTextElementResponse =>
	element instanceof RichTextElementResponse;
