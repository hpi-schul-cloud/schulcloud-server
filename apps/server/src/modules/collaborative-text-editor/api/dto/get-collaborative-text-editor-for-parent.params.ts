import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId } from 'class-validator';

export enum CollaborativeTextEditorParentType {
	BOARD_CONTENT_ELEMENT = 'content-element',
}

export class GetCollaborativeTextEditorForParentParams {
	@ApiProperty({
		required: true,
		nullable: false,
	})
	@IsMongoId()
	parentId!: string;

	@IsEnum(CollaborativeTextEditorParentType)
	@ApiProperty({
		description: 'Parent type of the collaborative text editor.',
		enum: CollaborativeTextEditorParentType,
		enumName: 'CollaborativeTextEditorParentType',
		required: true,
		nullable: false,
	})
	parentType!: CollaborativeTextEditorParentType;
}
