import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileStorageType, SchoolFeature, SchoolPermissions, SchoolPurpose } from '../../../domain';
import { CountyResponse } from './county.response';
import { FederalStateResponse } from './federal-state.response';
import { SchoolYearResponse } from './school-year.response';
import { YearsResponse } from './years.response';

export class SchoolResponse {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	createdAt!: Date;

	@ApiProperty()
	updatedAt!: Date;

	@ApiProperty()
	name!: string;

	@ApiPropertyOptional()
	officialSchoolNumber?: string;

	@ApiPropertyOptional({ type: () => SchoolYearResponse })
	currentYear?: SchoolYearResponse;

	@ApiProperty({ type: () => FederalStateResponse })
	federalState!: FederalStateResponse;

	@ApiPropertyOptional()
	county?: CountyResponse;

	@ApiPropertyOptional({ enum: SchoolPurpose, enumName: 'SchoolPurpose' })
	purpose?: SchoolPurpose;

	@ApiProperty({ enum: SchoolFeature, enumName: 'SchoolFeature', isArray: true })
	features!: SchoolFeature[];

	@ApiProperty()
	systemIds!: string[];

	@ApiProperty()
	inMaintenance!: boolean;

	@ApiProperty()
	isExternal!: boolean;

	@ApiPropertyOptional()
	logo_dataUrl?: string;

	@ApiPropertyOptional()
	logo_name?: string;

	@ApiPropertyOptional({ enum: FileStorageType, enumName: 'FileStorageType' })
	fileStorageType?: FileStorageType;

	@ApiPropertyOptional()
	language?: string;

	@ApiPropertyOptional()
	timezone?: string;

	@ApiPropertyOptional()
	permissions?: SchoolPermissions;

	@ApiProperty({ type: () => YearsResponse })
	years!: YearsResponse;
}
