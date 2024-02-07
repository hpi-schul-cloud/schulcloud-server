import { ApiProperty } from '@nestjs/swagger';
import { CountyResponse } from './county.response';

export class FederalStateResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	abbreviation: string;

	@ApiProperty()
	logoUrl: string;

	@ApiProperty({ type: [CountyResponse] })
	counties: CountyResponse[];

	constructor(props: FederalStateResponse) {
		this.id = props.id;
		this.name = props.name;
		this.abbreviation = props.abbreviation;
		this.logoUrl = props.logoUrl;
		this.counties = props.counties;
	}
}
