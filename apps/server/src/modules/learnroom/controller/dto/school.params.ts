import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class SchoolParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the school',
		required: true,
		nullable: false,
	})
	schoolId!: string;
}
