import { ApiProperty } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller/transformer';
import { IsNumber, IsString } from 'class-validator';

export class BoardErrorReportBodyParams {
	@ApiProperty({
		type: String,
		description: 'Type of the board error',
	})
	@IsString()
	@SanitizeHtml()
	public type!: string;

	@ApiProperty({
		type: String,
		description: 'Error message',
	})
	@IsString()
	@SanitizeHtml()
	public message!: string;

	@ApiProperty({
		type: String,
		description: 'URL of the page the user was working on',
	})
	@IsString()
	@SanitizeHtml()
	public url!: string;

	@ApiProperty({
		type: String,
		description: 'Id of the board the error occurred on',
	})
	@IsString()
	@SanitizeHtml()
	public boardId!: string;

	@ApiProperty({
		type: Number,
		description: 'Count of connection retries.',
	})
	@IsNumber()
	public retryCount!: number;

	@ApiProperty({
		type: String,
		description: 'Logged steps',
	})
	@IsString()
	@SanitizeHtml()
	public logSteps!: string[];
}
