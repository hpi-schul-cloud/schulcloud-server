import { CollaborativeTextEditorElementResponseDto } from '../dto/collaborative-text-editor-element-response.dto';
import { DeletedElementResponseDto } from '../dto/deleted-element-response.dto';
import { DrawingElementResponseDto } from '../dto/drawing-element-response.dto';
import { ExternalToolElementResponseDto } from '../dto/external-tool-element-response.dto';
import { FileElementResponseDto } from '../dto/file-element-response.dto';
import { H5pElementResponseDto } from '../dto/h5p-element-response.dto';
import { LinkElementResponseDto } from '../dto/link-element-response.dto';
import { RichTextElementResponseDto } from '../dto/rich-text-element-response.dto';
import { SubmissionContainerElementResponseDto } from '../dto/submission-container-element-response.dto';
import { VideoConferenceElementResponseDto } from '../dto/video-conference-element-response.dto';

export type CardResponseElementsInnerDto =
	| CollaborativeTextEditorElementResponseDto
	| DeletedElementResponseDto
	| DrawingElementResponseDto
	| ExternalToolElementResponseDto
	| FileElementResponseDto
	| LinkElementResponseDto
	| RichTextElementResponseDto
	| SubmissionContainerElementResponseDto
	| VideoConferenceElementResponseDto
	| H5pElementResponseDto;
