import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SchoolExternalToolParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the school.',
		required: true,
		nullable: false,
	})
	schoolId!: string;

	@IsMongoId()
	@ApiProperty({
		description: 'The id of the schoolExternalTool.',
		required: false,
		nullable: true,
	})
	schoolExternalToolId!: string;
}
