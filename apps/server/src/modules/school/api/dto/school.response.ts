import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileStorageType, InstanceFeature, SchoolFeature, SchoolPermissions, SchoolPurpose } from '../../domain';
import { CountyResponse } from './county.response';
import { FederalStateResponse } from './federal-state.response';
import { SchoolLogo } from './school-update-body.params';
import { SchoolYearResponse } from './school-year.response';
import { YearsResponse } from './years.response';

export class SchoolResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;

	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	officialSchoolNumber?: string;

	@ApiPropertyOptional({ type: SchoolYearResponse })
	currentYear?: SchoolYearResponse;

	@ApiPropertyOptional({ type: FederalStateResponse })
	federalState?: FederalStateResponse;

	@ApiPropertyOptional()
	county?: CountyResponse;

	@ApiPropertyOptional({ enum: SchoolPurpose, enumName: 'SchoolPurpose' })
	purpose?: SchoolPurpose;

	@ApiProperty({ enum: SchoolFeature, enumName: 'SchoolFeature', isArray: true })
	features: SchoolFeature[];

	@ApiProperty()
	systemIds: string[];

	@ApiPropertyOptional()
	inUserMigration?: boolean;

	@ApiProperty()
	inMaintenance: boolean;

	@ApiProperty()
	isExternal: boolean;

	@ApiPropertyOptional()
	logo?: SchoolLogo;

	@ApiPropertyOptional({ enum: FileStorageType, enumName: 'FileStorageType' })
	fileStorageType?: FileStorageType;

	@ApiPropertyOptional()
	language?: string;

	@ApiPropertyOptional()
	timezone?: string;

	@ApiPropertyOptional()
	permissions?: SchoolPermissions;

	@ApiProperty({ type: YearsResponse })
	years: YearsResponse;

	@ApiProperty({ enum: InstanceFeature, enumName: 'InstanceFeature', isArray: true })
	instanceFeatures: InstanceFeature[];

	constructor(props: SchoolResponse) {
		this.id = props.id;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
		this.name = props.name;
		this.officialSchoolNumber = props.officialSchoolNumber;
		this.federalState = props.federalState;
		this.currentYear = props.currentYear;
		this.purpose = props.purpose;
		this.features = props.features;
		this.county = props.county;
		this.systemIds = props.systemIds;
		this.inUserMigration = props.inUserMigration;
		this.inMaintenance = props.inMaintenance;
		this.isExternal = props.isExternal;
		this.logo = props.logo;
		this.fileStorageType = props.fileStorageType;
		this.language = props.language;
		this.timezone = props.timezone;
		this.permissions = props.permissions;
		this.years = props.years;
		this.instanceFeatures = props.instanceFeatures;
	}
}
