import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { ArixFields } from '../type/arix-fields';
import { ArixSearchCondition } from './arix-search-condition';

export class ArixSearchRequestParams {
	@ApiProperty({ description: 'The fields to search for', default: 'text,titel', examples: ['text,titel', '*'] })
	fields!: string | ArixFields[];

	@IsOptional()
	@IsString()
	@ApiPropertyOptional({
		description:
			'The limit of the search. limit="100" means that the first 100 records will be transmitted. limit="100,200" means that the next 100 records will be transmitted.',
		default: '1',
		examples: ['1', '100,200'],
	})
	limit?: string;

	@IsOptional()
	@ValidateNested({ each: true })
	@ApiPropertyOptional({
		description: 'The conditions of the search',
		type: [ArixSearchCondition],
		default: [{ field: 'titel_fields', value: 'watt' }],
		examples: [{ field: 'titel_fields', value: 'watt' }],
	})
	conditions?: ArixSearchCondition[];
}
