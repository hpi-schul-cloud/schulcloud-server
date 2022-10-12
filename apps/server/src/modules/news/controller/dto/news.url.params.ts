import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class NewsUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the news.',
		required: true,
		nullable: false,
	})
	newsId!: string;
}
