import { ApiProperty } from '@nestjs/swagger';

export class CountyResponse {
	constructor({ name, countyId, antaresKey }: CountyResponse) {
		this.name = name;
		this.countyId = countyId;
		this.antaresKey = antaresKey;
	}

	@ApiProperty()
	name: string;

	@ApiProperty()
	countyId: number;

	@ApiProperty()
	antaresKey: string;
}
