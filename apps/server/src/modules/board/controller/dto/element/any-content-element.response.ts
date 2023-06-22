import { FileElementResponse } from './file-element.response';
import { RichTextElementResponse } from './rich-text-element.response';
import { SubmissionContainerElementResponse } from './task-element.response';

export type AnyContentElementResponse =
	| FileElementResponse
	| RichTextElementResponse
	| SubmissionContainerElementResponse;
