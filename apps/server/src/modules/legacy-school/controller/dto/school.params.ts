import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SchoolParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the school.',
		required: true,
		nullable: false,
	})
	schoolId!: string;
}
