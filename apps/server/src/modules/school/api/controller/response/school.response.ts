import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SchoolFeature, SchoolPurpose } from '../../../domain';
import { CountyResponse } from './county.response';
import { FederalStateResponse } from './federal-state.response';
import { SchoolYearResponse } from './school-year.response';
import { SystemResponse } from './system.response';
import { YearsResponse } from './years.response';

export class SchoolResponse {
	constructor({
		id,
		name,
		officialSchoolNumber,
		federalState,
		currentYear,
		purpose,
		features,
		county,
		systems,
		inMaintenance,
		isExternal,
		logo_dataUrl,
		years,
	}: SchoolResponse) {
		this.id = id;
		this.name = name;
		this.officialSchoolNumber = officialSchoolNumber;
		this.federalState = federalState;
		this.currentYear = currentYear;
		this.purpose = purpose;
		this.features = features;
		this.county = county;
		this.systems = systems;
		this.inMaintenance = inMaintenance;
		this.isExternal = isExternal;
		this.logo_dataUrl = logo_dataUrl;
		this.years = years;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	officialSchoolNumber?: string;

	@ApiProperty({ type: () => SchoolYearResponse })
	currentYear?: SchoolYearResponse;

	@ApiProperty({ type: () => FederalStateResponse })
	federalState: FederalStateResponse;

	@ApiPropertyOptional()
	county?: CountyResponse;

	@ApiPropertyOptional()
	purpose?: SchoolPurpose;

	@ApiPropertyOptional()
	features?: SchoolFeature[];

	@ApiPropertyOptional({ type: () => [SystemResponse] })
	systems?: SystemResponse[];

	@ApiProperty()
	inMaintenance: boolean;

	@ApiProperty()
	isExternal: boolean;

	@ApiPropertyOptional()
	logo_dataUrl?: string;

	@ApiProperty({ type: () => YearsResponse })
	years: YearsResponse;
}
