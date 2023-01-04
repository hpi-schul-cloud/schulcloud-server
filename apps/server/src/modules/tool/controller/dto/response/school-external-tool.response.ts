import { ApiProperty } from '@nestjs/swagger';
import { CustomParameterEntryResponse } from './custom-parameter-entry.response';

export class SchoolExternalToolResponse {
	@ApiProperty()
	toolId: string;

	@ApiProperty()
	schoolId: string;

	@ApiProperty()
	parameters: CustomParameterEntryResponse[];

	@ApiProperty()
	toolVersion: number;

	constructor(response: SchoolExternalToolResponse) {
		this.toolId = response.toolId;
		this.schoolId = response.schoolId;
		this.parameters = response.parameters;
		this.toolVersion = response.toolVersion;
	}
}
