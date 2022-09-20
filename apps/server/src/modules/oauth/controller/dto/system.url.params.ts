import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class SystemUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the system.',
		required: true,
		nullable: false,
	})
	systemId!: string;
}
