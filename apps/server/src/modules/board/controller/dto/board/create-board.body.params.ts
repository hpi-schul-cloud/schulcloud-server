import { ApiProperty } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller';
import { IsEnum, IsMongoId, NotEquals, MaxLength, MinLength } from 'class-validator';
import { BoardExternalReferenceType, BoardLayout } from '../../../domain';

export class CreateBoardBodyParams {
	@ApiProperty({
		description: 'The title of the board',
		required: true,
	})
	@MinLength(1)
	@MaxLength(100)
	@SanitizeHtml()
	title!: string;

	@IsMongoId()
	@ApiProperty({
		description: 'The id of the parent',
		required: true,
	})
	parentId!: string;

	@ApiProperty({
		description: 'The type of the parent',
		required: true,
		enum: BoardExternalReferenceType,
		enumName: 'BoardParentType',
	})
	@IsEnum(BoardExternalReferenceType)
	parentType!: BoardExternalReferenceType;

	@ApiProperty({
		description: 'The layout of the board',
		default: BoardLayout.COLUMNS,
		enum: BoardLayout,
		enumName: 'BoardLayout',
	})
	@IsEnum(BoardLayout, {})
	@NotEquals(BoardLayout[BoardLayout.GRID])
	layout!: BoardLayout;
}
