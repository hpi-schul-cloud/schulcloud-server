import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SchoolYearResponse } from './school-year.response';

export class YearsResponse {
	constructor(props: YearsResponse) {
		this.schoolYears = props.schoolYears;
		this.defaultYear = props.defaultYear;
		this.activeYear = props.activeYear;
		this.lastYear = props.lastYear;
		this.nextYear = props.nextYear;
	}

	@ApiProperty({ type: () => [SchoolYearResponse] })
	schoolYears: SchoolYearResponse[];

	@ApiPropertyOptional()
	activeYear?: SchoolYearResponse;

	@ApiPropertyOptional()
	defaultYear?: SchoolYearResponse;

	@ApiPropertyOptional()
	lastYear?: SchoolYearResponse;

	@ApiPropertyOptional()
	nextYear?: SchoolYearResponse;
}
