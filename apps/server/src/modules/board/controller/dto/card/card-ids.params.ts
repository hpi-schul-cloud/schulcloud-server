import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class CardIdsParams {
	@IsMongoId({ each: true })
	@ApiProperty({
		description: 'Array of Ids to be loaded',
		type: [String],
	})
	ids!: string[] | string;
}
