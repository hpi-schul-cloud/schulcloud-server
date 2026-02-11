import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMaxSize, ArrayMinSize, IsMongoId } from 'class-validator';

export class DeletionRequestParams {
	@IsArray()
	@ArrayMinSize(1)
	@ArrayMaxSize(100)
	@IsMongoId({ each: true })
	@ApiProperty({
		description: 'The IDs of the users to be deleted',
		required: true,
	})
	public ids!: string[];
}
