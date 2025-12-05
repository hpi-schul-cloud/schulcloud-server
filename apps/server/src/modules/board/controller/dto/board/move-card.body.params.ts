import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsInt, Min, IsOptional } from 'class-validator';

export class MoveCardBodyParams {
	@IsMongoId()
	@ApiProperty({
		required: true,
		nullable: false,
	})
	toColumnId!: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	@ApiPropertyOptional({
		description: 'to bring element to a specific position, default is last position',
		type: Number,
		required: false,
		nullable: false,
	})
	toPosition?: number;
}
