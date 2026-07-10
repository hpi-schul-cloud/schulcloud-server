import type { CollaborativeTextEditorElementResponse } from './collaborative-text-editor-element.response';
import type { DeletedElementResponse } from './deleted-element.response';
import type { DrawingElementResponse } from './drawing-element.response';
import type { ExternalToolElementResponse } from './external-tool-element.response';
import type { FileElementResponse } from './file-element.response';
import type { FileFolderElementResponse } from './file-folder-element.response';
import type { H5pElementResponse } from './h5p-element.response';
import type { LinkElementResponse } from './link-element.response';
import type { RichTextElementResponse } from './rich-text-element.response';
import type { VideoConferenceElementResponse } from './video-conference-element.response';

export type AnyContentElementResponse =
	| FileElementResponse
	| LinkElementResponse
	| RichTextElementResponse
	| ExternalToolElementResponse
	| DrawingElementResponse
	| CollaborativeTextEditorElementResponse
	| DeletedElementResponse
	| VideoConferenceElementResponse
	| FileFolderElementResponse
	| H5pElementResponse;
