import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BoardErrorReportBodyParams {
	@ApiProperty({
		type: String,
		description: 'Type of the board error',
	})
	@IsString()
	public type!: string;

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
		type: String,
		description: 'Id of the board the error occurred on',
	})
	@IsString()
	public boardId!: string;

	@ApiProperty({
		type: Number,
		description: 'Count of connection retries.',
	})
	@IsNumber()
	public retryCount!: number;
}
