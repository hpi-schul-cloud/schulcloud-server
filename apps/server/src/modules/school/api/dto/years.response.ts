import { ApiProperty } from '@nestjs/swagger';
import { SchoolYearResponse } from './school-year.response';

export class YearsResponse {
	@ApiProperty({ type: [SchoolYearResponse] })
	schoolYears: SchoolYearResponse[];

	@ApiProperty()
	activeYear: SchoolYearResponse;

	@ApiProperty()
	lastYear: SchoolYearResponse;

	@ApiProperty()
	nextYear: SchoolYearResponse;

	constructor(props: YearsResponse) {
		this.schoolYears = props.schoolYears;
		this.activeYear = props.activeYear;
		this.lastYear = props.lastYear;
		this.nextYear = props.nextYear;
	}
}
