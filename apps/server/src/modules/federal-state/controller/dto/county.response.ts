import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { IsNumber, IsString } from 'class-validator';

export class CountyResponse {
	constructor({ name, countyId, antaresKey }: CountyResponse) {
		this.name = name;
		this.countyId = countyId;
		this.antaresKey = antaresKey;
	}

	@ApiProperty()
	@DecodeHtmlEntities()
	name: string;

	@ApiProperty()
	@IsNumber()
	countyId: number;

	@ApiProperty()
	@IsString()
	@DecodeHtmlEntities()
	antaresKey: string;
}
