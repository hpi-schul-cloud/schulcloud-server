import { ExternalToolElementResponse } from './external-tool-element.response';
import { FileElementResponse } from './file-element.response';
import { LinkElementResponse } from './link-element.response';
import { RichTextElementResponse } from './rich-text-element.response';
import { SubmissionContainerElementResponse } from './submission-container-element.response';
import { LearnstoreElementResponse } from './learnstore-element.response';

export type AnyContentElementResponse =
	| FileElementResponse
	| LinkElementResponse
	| RichTextElementResponse
	| SubmissionContainerElementResponse
	| ExternalToolElementResponse
	| LearnstoreElementResponse;

export const isFileElementResponse = (element: AnyContentElementResponse): element is FileElementResponse =>
	element instanceof FileElementResponse;

export const isRichTextElementResponse = (element: AnyContentElementResponse): element is RichTextElementResponse =>
	element instanceof RichTextElementResponse;
