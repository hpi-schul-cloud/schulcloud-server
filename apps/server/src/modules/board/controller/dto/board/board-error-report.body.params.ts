import { BoardErrorContextTypeEnum } from '../../../interface/board-error-context-type.enum';
import { BoardErrorTypeEnum } from '../../../interface/board-error-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class BoardErrorReportBodyParams {
	@ApiProperty({
		enum: BoardErrorTypeEnum,
		enumName: 'BoardErrorTypeEnum',
		required: true,
	})
	public errorType!: BoardErrorTypeEnum;

	@ApiProperty({
		type: String,
		description: 'URL of the page the user was working on',
		required: true,
	})
	public pageUrl!: string;

	@ApiProperty({
		enum: BoardErrorContextTypeEnum,
		enumName: 'BoardErrorContextTypeEnum',
		required: true,
	})
	public contextType!: BoardErrorContextTypeEnum;

	@ApiProperty({
		type: String,
		description: 'EntityId (e.g. boardId)',
		required: true,
	})
	public contextId!: string;

	@ApiProperty({
		type: String,
		description: 'SchoolId (EntityId)',
		required: true,
	})
	public schoolId!: string;

	@ApiProperty({
		type: String,
		description: 'UserId (EntityId)',
		required: true,
	})
	public userId!: string;

	@ApiProperty({
		type: String,
		description: 'Error message',
		required: true,
	})
	public errorMessage!: string;

	@ApiProperty({
		type: String,
		description: 'Timestamp of the error (ISO 8601)',
		required: true,
	})
	public timestamp!: string;
}
