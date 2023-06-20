import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString } from 'class-validator';

export class ContentElementUrlParams {
	@IsMongoId()
	@IsString()
	@ApiProperty({
		description: 'The id of the element.',
		required: true,
		nullable: false,
	})
	contentElementId!: string;
}
