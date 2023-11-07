import { County, FileStorageType, SchoolFeature, SchoolPermissions, SchoolPurpose } from '../type';
import { FederalStateDto } from './federal-state.dto';
import { SchoolYearDto } from './school-year.dto';
import { SystemDto } from './system.dto';
import { YearsDto } from './years.dto';

export class SchoolDto {
	constructor(props: SchoolDto) {
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

	id: string;

	name: string;

	officialSchoolNumber?: string;

	currentYear?: SchoolYearDto;

	federalState: FederalStateDto;

	county?: County;

	purpose?: SchoolPurpose;

	features?: SchoolFeature[];

	systems?: SystemDto[];

	inMaintenance: boolean;

	isExternal: boolean;

	logo_dataUrl?: string;

	fileStorageType?: FileStorageType;

	language?: string;

	timezone?: string;

	permissions?: SchoolPermissions;

	years: YearsDto;
}
