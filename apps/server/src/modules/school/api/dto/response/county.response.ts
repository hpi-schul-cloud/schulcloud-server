import { ApiProperty } from '@nestjs/swagger';

export class CountyResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	countyId: number;

	@ApiProperty()
	antaresKey: string;

	constructor(props: CountyResponse) {
		this.id = props.id;
		this.name = props.name;
		this.countyId = props.countyId;
		this.antaresKey = props.antaresKey;
	}
}
