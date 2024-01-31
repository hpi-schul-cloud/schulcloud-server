import { ApiProperty } from '@nestjs/swagger';
import { ArixSearchResult } from '../type/arix-search-result';

export class ArixSearchResponse {
	@ApiProperty({ description: 'The search result', type: ArixSearchResult })
	result!: ArixSearchResult;
}
