import { IsEnum, IsNumber, IsString } from 'class-validator';
import { BoardErrorContextTypeEnum } from '../../../interface/board-error-context-type.enum';
import { BoardErrorTypeEnum } from '../../../interface/board-error-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class BoardErrorReportBodyParams {
	@ApiProperty({
		enum: BoardErrorTypeEnum,
		enumName: 'BoardErrorTypeEnum',
	})
	@IsEnum(BoardErrorTypeEnum)
	public type!: BoardErrorTypeEnum;

	@ApiProperty({
		type: String,
		description: 'Error message',
	})
	@IsString()
	public message!: string;

	@ApiProperty({
		type: String,
		description: 'URL of the page the user was working on',
	})
	@IsString()
	public url!: string;

	@ApiProperty({
		enum: BoardErrorContextTypeEnum,
		enumName: 'BoardErrorContextTypeEnum',
	})
	@IsEnum(BoardErrorContextTypeEnum)
	public contextType!: BoardErrorContextTypeEnum;

	@ApiProperty({
		type: String,
		description: 'EntityId (e.g. boardId)',
	})
	@IsString()
	public contextId!: string;

	@ApiProperty({
		type: Number,
		description: 'Count of connection retries.',
	})
	@IsNumber()
	public retryCount!: number;
}
