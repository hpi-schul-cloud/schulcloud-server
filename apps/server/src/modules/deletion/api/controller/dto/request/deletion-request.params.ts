import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsMongoId } from 'class-validator';

export class DeletionRequestParams {
	// In NestJS v11 (Express v5), a single query param value comes as a string, not an array.
	// Transform ensures a single value is wrapped in an array before validation.
	@Transform(({ value }) => (Array.isArray(value) ? value : [value]))
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
