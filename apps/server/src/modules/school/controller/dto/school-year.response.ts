import { ApiProperty } from '@nestjs/swagger';

export class SchoolYearResponse {
	constructor({ id, name, startDate, endDate }: SchoolYearResponse) {
		this.id = id;
		this.name = name;
		this.startDate = startDate;
		this.endDate = endDate;
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
