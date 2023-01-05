import { ApiProperty } from '@nestjs/swagger';
import { CustomParameterEntryResponse } from './custom-parameter-entry.response';
import { SchoolExternalToolStatusResponse } from './school-external-tool-status.response';

export class SchoolExternalToolResponse {
	@ApiProperty()
	name: string;

	@ApiProperty()
	toolId: string;

	@ApiProperty()
	schoolId: string;

	@ApiProperty()
	parameters: CustomParameterEntryResponse[];

	@ApiProperty()
	toolVersion: number;

	@ApiProperty({ enum: SchoolExternalToolStatusResponse })
	status: SchoolExternalToolStatusResponse;

	constructor(response: SchoolExternalToolResponse) {
		this.name = response.name;
		this.toolId = response.toolId;
		this.schoolId = response.schoolId;
		this.parameters = response.parameters;
		this.toolVersion = response.toolVersion;
		this.status = response.status;
	}
}
