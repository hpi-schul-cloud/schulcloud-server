import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class ArixSearchCondition {
	@ApiProperty({
		description: 'The field to search for',
		examples: ['text', 'titel', 'text_fields', 'titel_fields'],
	})
	field!: string;

	@ApiProperty({ description: 'The value to search for', examples: ['watt'] })
	value!: string;

	@IsOptional()
	@ApiPropertyOptional({ description: 'The operator to use', examples: ['OR', 'AND'] })
	operator?: 'OR' | 'AND';

	@IsOptional()
	@ApiPropertyOptional({ description: 'The option to use', examples: ['BEGIN', 'WORD'] })
	option?: 'BEGIN' | 'WORD';
}
