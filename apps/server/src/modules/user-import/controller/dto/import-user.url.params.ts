import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class ImportUserUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the imported user.',
		required: true,
		nullable: false,
	})
	importUserId!: string;
}
