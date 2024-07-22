import { ApiProperty } from '@nestjs/swagger';
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

	@ApiProperty()
	isDeactivated: boolean;

	@ApiProperty({ type: [CustomParameterEntryResponse] })
	parameters: CustomParameterEntryResponse[];

	@ApiProperty({ type: SchoolExternalToolConfigurationStatusResponse })
	status: SchoolExternalToolConfigurationStatusResponse;

	constructor(response: SchoolExternalToolResponse) {
		this.id = response.id;
		this.name = response.name;
		this.toolId = response.toolId;
		this.schoolId = response.schoolId;
		this.isDeactivated = response.isDeactivated;
		this.parameters = response.parameters;
		this.status = response.status;
	}
}
