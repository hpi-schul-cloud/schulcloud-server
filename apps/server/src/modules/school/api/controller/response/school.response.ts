import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileStorageType, SchoolFeature, SchoolPermissions, SchoolPurpose } from '../../../domain';
import { CountyResponse } from './county.response';
import { FederalStateResponse } from './federal-state.response';
import { SchoolYearResponse } from './school-year.response';
import { SystemResponse } from './system.response';
import { YearsResponse } from './years.response';

export class SchoolResponse {
	constructor(props: SchoolResponse) {
		this.id = props.id;
		this.name = props.name;
		this.officialSchoolNumber = props.officialSchoolNumber;
		this.federalState = props.federalState;
		this.currentYear = props.currentYear;
		this.purpose = props.purpose;
		this.features = props.features;
		this.county = props.county;
		this.systems = props.systems;
		this.inMaintenance = props.inMaintenance;
		this.isExternal = props.isExternal;
		this.logo_dataUrl = props.logo_dataUrl;
		this.fileStorageType = props.fileStorageType;
		this.language = props.language;
		this.timezone = props.timezone;
		this.permissions = props.permissions;
		this.years = props.years;
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

	@ApiPropertyOptional({ enum: SchoolPurpose, enumName: 'SchoolPurpose' })
	purpose?: SchoolPurpose;

	@ApiPropertyOptional({ enum: SchoolFeature, enumName: 'SchoolFeature', isArray: true })
	features?: SchoolFeature[];

	@ApiPropertyOptional({ type: () => [SystemResponse] })
	systems?: SystemResponse[];

	@ApiProperty()
	inMaintenance: boolean;

	@ApiProperty()
	isExternal: boolean;

	@ApiPropertyOptional()
	logo_dataUrl?: string;

	@ApiPropertyOptional({ enum: FileStorageType, enumName: 'FileStorageType' })
	fileStorageType?: FileStorageType;

	@ApiPropertyOptional()
	language?: string;

	@ApiPropertyOptional()
	timezone?: string;

	@ApiPropertyOptional()
	permissions?: SchoolPermissions;

	@ApiProperty({ type: () => YearsResponse })
	years: YearsResponse;
}
