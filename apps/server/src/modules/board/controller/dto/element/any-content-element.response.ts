import type { CollaborativeTextEditorElementResponse } from './collaborative-text-editor-element.response';
import type { DeletedElementResponse } from './deleted-element.response';
import type { DrawingElementResponse } from './drawing-element.response';
import type { ExternalToolElementResponse } from './external-tool-element.response';
import { FileElementResponse } from './file-element.response';
import type { FileFolderElementResponse } from './file-folder-element.response';
import type { LinkElementResponse } from './link-element.response';
import { RichTextElementResponse } from './rich-text-element.response';
import type { SubmissionContainerElementResponse } from './submission-container-element.response';
import type { VideoConferenceElementResponse } from './video-conference-element.response';

export type AnyContentElementResponse =
	| FileElementResponse
	| LinkElementResponse
	| RichTextElementResponse
	| SubmissionContainerElementResponse
	| ExternalToolElementResponse
	| DrawingElementResponse
	| CollaborativeTextEditorElementResponse
	| DeletedElementResponse
	| VideoConferenceElementResponse
	| FileFolderElementResponse;

export const isFileElementResponse = (element: AnyContentElementResponse): element is FileElementResponse =>
	element instanceof FileElementResponse;

export const isRichTextElementResponse = (element: AnyContentElementResponse): element is RichTextElementResponse =>
	element instanceof RichTextElementResponse;
