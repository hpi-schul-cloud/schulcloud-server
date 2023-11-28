import { ApiProperty } from '@nestjs/swagger';

export class SchoolYearResponse {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	name!: string;

	@ApiProperty()
	startDate!: Date;

	@ApiProperty()
	endDate!: Date;
}
