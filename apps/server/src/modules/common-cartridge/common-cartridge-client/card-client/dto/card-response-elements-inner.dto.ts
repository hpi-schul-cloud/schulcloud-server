import { CollaborativeTextEditorElementResponseDto } from './collaborative-text-editor-element-response.dto';
import { DeletedElementResponseDto } from './deleted-element-response.dto';
import { DrawingElementResponseDto } from './drawing-element-response.dto';
import { ExternalToolElementResponseDto } from './external-tool-element-response.dto';
import { FileElementResponseDto } from './file-element-response.dto';
import { LinkElementResponseDto } from './link-element-response.dto';
import { RichTextElementResponseDto } from './rich-text-element-response.dto';
import { SubmissionContainerElementResponseDto } from './submission-container-element-response.dto';

export type CardResponseElementsInnerDto =
	| CollaborativeTextEditorElementResponseDto
	| DeletedElementResponseDto
	| DrawingElementResponseDto
	| ExternalToolElementResponseDto
	| FileElementResponseDto
	| LinkElementResponseDto
	| RichTextElementResponseDto
	| SubmissionContainerElementResponseDto;
