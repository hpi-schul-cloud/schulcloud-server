import { BoardExternalReferenceType, BoardLayout } from '../../../domain';
import { ApiProperty } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller/transformer';
import { IsEnum, IsMongoId, MaxLength, MinLength, NotEquals } from 'class-validator';

export class CreateBoardsBodyParams {
	@ApiProperty({
		description: 'The title of the board',
		required: true,
	})
	@MinLength(1)
	@MaxLength(100)
	@SanitizeHtml()
	public title!: string;

	@IsMongoId()
	@ApiProperty({
		description: 'The id of the parent',
		required: true,
	})
	public parentId!: string;

	@ApiProperty({
		description: 'The type of the parent',
		required: true,
		enum: BoardExternalReferenceType,
		enumName: 'BoardParentType',
	})
	@IsEnum(BoardExternalReferenceType)
	public parentType!: BoardExternalReferenceType;

	@ApiProperty({
		description: 'The layout of the board',
		default: BoardLayout.COLUMNS,
		enum: BoardLayout,
		enumName: 'BoardLayout',
	})
	@IsEnum(BoardLayout, {})
	@NotEquals(BoardLayout[BoardLayout.GRID])
	public layout!: BoardLayout;

	@ApiProperty({
		description: 'Identifier of common cartridge board',
		required: false,
	})
	public xmlIdentifier?: string;
}
