import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { CountyResponse } from './county.response';

/**
 * DTO for returning a task document via api.
 */
export class FederalStateResponse {
	constructor({ _id, name, abbreviation, logoUrl, counties, createdAt, updatedAt }: FederalStateResponse) {
		this._id = _id;
		this.name = name;
		this.abbreviation = abbreviation;
		this.logoUrl = logoUrl;
		this.counties = counties;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
	}

	@ApiProperty()
	_id: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	name: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	abbreviation: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	logoUrl: string;

	@ApiPropertyOptional()
	@DecodeHtmlEntities()
	counties?: CountyResponse[];

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;
}
