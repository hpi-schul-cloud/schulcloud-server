import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString } from 'class-validator';

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

	@ApiProperty({
		type: [String],
		description: 'List of logged steps',
	})
	@IsArray()
	@IsString({ each: true })
	public logSteps!: string[];

	@ApiProperty({
		type: String,
		description: 'Operating System of the user',
	})
	@IsString()
	public os!: string;

	@ApiProperty({
		type: String,
		description: 'Browser of the user',
	})
	@IsString()
	public browser!: string;

	@ApiProperty({
		type: String,
		description: 'Device type of the user',
	})
	@IsString()
	public deviceType!: string;
}
