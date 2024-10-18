import { DeletedElementContentDto } from '../dto/deleted-element-content.dto';
import { DrawingElementContentDto } from '../dto/drawing-element-content.dto';
import { ExternalToolElementContentDto } from '../dto/external-tool-element-content.dto';
import { FileElementContentDto } from '../dto/file-element-content.dto';
import { LinkElementContentDto } from '../dto/link-element-content.dto';
import { RichTextElementContentDto } from '../dto/rich-text-element-content.dto';
import { SubmissionContainerElementContentDto } from '../dto/submission-container-element-content.dto';

export type CardContentElementInner =
	| LinkElementContentDto
	| DeletedElementContentDto
	| DrawingElementContentDto
	| ExternalToolElementContentDto
	| FileElementContentDto
	| RichTextElementContentDto
	| SubmissionContainerElementContentDto
	| object;
