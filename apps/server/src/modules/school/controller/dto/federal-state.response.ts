import { ApiProperty } from '@nestjs/swagger';
import { CountyResponse } from './county.response';

export class FederalStateResponse {
	constructor({ id, name, abbreviation, logoUrl, counties }: FederalStateResponse) {
		this.id = id;
		this.name = name;
		this.abbreviation = abbreviation;
		this.logoUrl = logoUrl;
		this.counties = counties;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	abbreviation: string;

	@ApiProperty()
	logoUrl: string;

	@ApiProperty({ type: () => CountyResponse, isArray: true })
	counties?: CountyResponse[];
}
