import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class ColumnUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the column.',
		required: true,
		nullable: false,
	})
	columnId!: string;
}
