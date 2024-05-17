import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomParameterEntryResponse } from './custom-parameter-entry.response';
import { SchoolExternalToolConfigurationStatusResponse } from './school-external-tool-configuration.response';

export class SchoolExternalToolResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	toolId: string;

	@ApiProperty()
	schoolId: string;

	@ApiProperty({ type: [CustomParameterEntryResponse] })
	parameters: CustomParameterEntryResponse[];

	@ApiProperty({ type: SchoolExternalToolConfigurationStatusResponse })
	status: SchoolExternalToolConfigurationStatusResponse;

	@ApiPropertyOptional()
	logoUrl?: string;

	constructor(response: SchoolExternalToolResponse) {
		this.id = response.id;
		this.name = response.name;
		this.toolId = response.toolId;
		this.schoolId = response.schoolId;
		this.parameters = response.parameters;
		this.status = response.status;
		this.logoUrl = response.logoUrl;
	}
}
