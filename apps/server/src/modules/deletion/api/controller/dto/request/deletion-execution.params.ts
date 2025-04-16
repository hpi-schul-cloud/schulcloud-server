import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId } from 'class-validator';

export class DeletionExecutionParams {
	@ApiProperty({
		description: 'The IDs of the users to be deleted',
		required: true,
	})
	@IsArray()
	@IsMongoId({ each: true })
	public ids!: string[];
}
