import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsMongoId } from 'class-validator';

export class DeletionRequestParams {
	@IsArray()
	@ArrayMinSize(1)
	@ArrayMaxSize(100)
	@IsMongoId({ each: true })
	@ApiProperty({
		description: 'The IDs of the users to be deleted',
		required: true,
	})
	ids!: string[];
}
