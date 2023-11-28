import { ApiProperty } from '@nestjs/swagger';

export class CountyResponse {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	name!: string;

	@ApiProperty()
	countyId!: number;

	@ApiProperty()
	antaresKey!: string;
}
