import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';
import { BoardExternalReferenceType, ElementReferenceType, ParentNodeType } from '../../../domain';
import { AnyContentElementResponse } from './any-content-element.response';
import { CollaborativeTextEditorElementResponse } from './collaborative-text-editor-element.response';
import { DeletedElementResponse } from './deleted-element.response';
import { DrawingElementResponse } from './drawing-element.response';
import { ExternalToolElementResponse } from './external-tool-element.response';
import { FileElementResponse } from './file-element.response';
import { FileFolderElementResponse } from './file-folder-element.response';
import { LinkElementResponse } from './link-element.response';
import { RichTextElementResponse } from './rich-text-element.response';
import { SubmissionContainerElementResponse } from './submission-container-element.response';
import { VideoConferenceElementResponse } from './video-conference-element.response';

export class ParentNodeInfo {
	constructor(props: ParentNodeInfo) {
		this.id = props.id;
		this.type = props.type;
		this.name = props.name;
	}

	@ApiProperty({ description: 'The ID of the parent node' })
	id: EntityId;

	@ApiProperty({
		description: 'The type of the parent node',
		enumName: 'ParentNodeType',
		enum: [...Object.values(BoardExternalReferenceType), ...Object.values(ElementReferenceType)],
	})
	type: ParentNodeType;

	@ApiProperty({ description: 'The name of the parent node' })
	name: string;
}

@ApiExtraModels(
	ExternalToolElementResponse,
	FileElementResponse,
	LinkElementResponse,
	RichTextElementResponse,
	SubmissionContainerElementResponse,
	DrawingElementResponse,
	CollaborativeTextEditorElementResponse,
	DeletedElementResponse,
	VideoConferenceElementResponse,
	FileFolderElementResponse,
	ParentNodeInfo
)
export class ElementWithParentHierarchyResponse {
	constructor(props: ElementWithParentHierarchyResponse) {
		this.element = props.element;
		this.parentHierarchy = props.parentHierarchy;
	}

	@ApiProperty({
		description: 'The element data',
		oneOf: [
			{ $ref: getSchemaPath(ExternalToolElementResponse) },
			{ $ref: getSchemaPath(FileElementResponse) },
			{ $ref: getSchemaPath(LinkElementResponse) },
			{ $ref: getSchemaPath(RichTextElementResponse) },
			{ $ref: getSchemaPath(SubmissionContainerElementResponse) },
			{ $ref: getSchemaPath(DrawingElementResponse) },
			{ $ref: getSchemaPath(CollaborativeTextEditorElementResponse) },
			{ $ref: getSchemaPath(DeletedElementResponse) },
			{ $ref: getSchemaPath(VideoConferenceElementResponse) },
			{ $ref: getSchemaPath(FileFolderElementResponse) },
		],
	})
	element: AnyContentElementResponse;

	@ApiProperty({
		description: 'The hierarchical path of parent elements',
		type: 'array',
		items: {
			$ref: getSchemaPath(ParentNodeInfo),
		},
	})
	parentHierarchy: ParentNodeInfo[];
}
