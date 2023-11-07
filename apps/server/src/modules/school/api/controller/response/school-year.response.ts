import { ApiProperty } from '@nestjs/swagger';

export class SchoolYearResponse {
	constructor(props: SchoolYearResponse) {
		this.id = props.id;
		this.name = props.name;
		this.startDate = props.startDate;
		this.endDate = props.endDate;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	startDate: Date;

	@ApiProperty()
	endDate: Date;
}
