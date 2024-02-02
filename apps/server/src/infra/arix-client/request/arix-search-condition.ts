import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class ArixSearchCondition {
	// TODO: add more fields
	@ApiProperty({
		description: 'The field to search for',
		examples: ['text', 'titel', 'text_fields', 'titel_fields'],
	})
	field!: string;

	@ApiProperty({ description: 'The value to search for', examples: ['watt'] })
	value!: string;

	@IsOptional()
	@ApiPropertyOptional({ description: 'The operator to use', examples: ['or', 'and'] })
	operator?: 'or' | 'and';

	@IsOptional()
	@ApiPropertyOptional({ description: 'The option to use', examples: ['begin', 'word'] })
	option?: 'begin' | 'word';
}
