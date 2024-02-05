import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ArixSearchCondition } from './arix-search-condition';

export class ArixSearchRequestParams {
	@IsString()
	@ApiProperty({
		description: 'The fields to search for',
		default: 'text,titel',
		examples: [
			'*',
			'text',
			'titel',
			'typ',
			'utitel',
			'sertitel',
			'serutitel',
			'vorfbis',
			'verfende',
			'orgtitel',
			'sortsertitel',
			'topographie',
			'personen',
			'darsteller',
			'url',
			'quelle',
			'didanmerk',
		],
	})
	fields!: string;

	@IsOptional()
	@ApiPropertyOptional({
		description:
			'The limit of the search. limit="100" means that the first 100 records will be transmitted. limit="100,200" means that the next 100 records will be transmitted.',
		default: '1',
		examples: ['1', '100,200'],
	})
	limit?: string;

	@IsOptional()
	@ApiPropertyOptional({
		description: 'The conditions of the search',
		type: ArixSearchCondition,
		default: [{ field: 'titel_fields', value: 'watt' }],
		example: { field: 'titel_fields', value: 'watt' },
	})
	condition?: ArixSearchCondition;

	@IsOptional()
	@ApiPropertyOptional({
		description: 'Shows EAF field names',
		default: 'eaf',
	})
	eaf?: 'eaf' | undefined;
}
