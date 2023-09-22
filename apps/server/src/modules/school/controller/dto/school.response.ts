import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FederalStateResponse } from './federal-state.response';
import { SchoolYearResponse } from './school-year.response';

export class SchoolResponse {
	constructor({ id, name, officialSchoolNumber, federalState, schoolYear }: SchoolResponse) {
		this.id = id;
		this.name = name;
		this.officialSchoolNumber = officialSchoolNumber;
		this.federalState = federalState;
		this.schoolYear = schoolYear;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	officialSchoolNumber?: string;

	@ApiProperty({ type: () => FederalStateResponse })
	federalState: FederalStateResponse;

	@ApiProperty({ type: () => SchoolYearResponse })
	schoolYear?: SchoolYearResponse;
}
