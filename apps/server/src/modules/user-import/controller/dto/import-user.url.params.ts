import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class ImportUserUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of an importuser object, that matches an internal user with an external user.',
		required: true,
		nullable: false,
	})
	importUserId!: string;
}
