import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class LineUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the line',
		required: true,
		nullable: false,
	})
	lineId!: string;
}
