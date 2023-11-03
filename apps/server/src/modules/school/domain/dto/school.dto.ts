import { County, SchoolFeature, SchoolPurpose } from '../type';
import { FileStorageType } from '../type/file-storage-type.enum';
import { FederalStateDto } from './federal-state.dto';
import { SchoolYearDto } from './school-year.dto';
import { SystemDto } from './system.dto';
import { YearsDto } from './years.dto';

export class SchoolDto {
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
		fileStorageType,
		language,
		timezone,
		years,
	}: SchoolDto) {
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
		this.fileStorageType = fileStorageType;
		this.language = language;
		this.timezone = timezone;
		this.years = years;
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

	years: YearsDto;
}
