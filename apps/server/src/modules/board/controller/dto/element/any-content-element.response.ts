import { AppointmentFinderElementResponse } from './appointment-finder-element.response';
import { CollaborativeTextEditorElementResponse } from './collaborative-text-editor-element.response';
import { DeletedElementResponse } from './deleted-element.response';
import { DrawingElementResponse } from './drawing-element.response';
import { ExternalToolElementResponse } from './external-tool-element.response';
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
	| DrawingElementResponse
	| CollaborativeTextEditorElementResponse
	| DeletedElementResponse
	| AppointmentFinderElementResponse;

export const isFileElementResponse = (element: AnyContentElementResponse): element is FileElementResponse =>
	element instanceof FileElementResponse;

export const isRichTextElementResponse = (element: AnyContentElementResponse): element is RichTextElementResponse =>
	element instanceof RichTextElementResponse;
