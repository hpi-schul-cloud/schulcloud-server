import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CountyResponse } from './county.response';

export class FederalStateResponse {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	name!: string;

	@ApiProperty()
	abbreviation!: string;

	@ApiProperty()
	logoUrl!: string;

	@ApiPropertyOptional({ type: () => [CountyResponse] })
	counties?: CountyResponse[];
}
