import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SchoolYearResponse } from './school-year.response';

export class YearsResponse {
	constructor({ schoolYears, defaultYear, activeYear, lastYear, nextYear }: YearsResponse) {
		this.schoolYears = schoolYears;
		this.defaultYear = defaultYear;
		this.activeYear = activeYear;
		this.lastYear = lastYear;
		this.nextYear = nextYear;
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
