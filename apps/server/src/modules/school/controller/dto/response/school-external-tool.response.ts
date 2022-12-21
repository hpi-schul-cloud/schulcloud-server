import { ApiProperty } from '@nestjs/swagger';
import { CustomParameterEntryDO } from '@shared/domain/domainobject/external-tool/custom-parameter-entry.do';

export class SchoolExternalToolResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	toolId: string;

	@ApiProperty()
	schoolId: string;

	@ApiProperty()
	parameters: CustomParameterEntryDO[];

	@ApiProperty()
	version: number;

	constructor(response: SchoolExternalToolResponse) {
		this.id = response.id;
		this.toolId = response.toolId;
		this.schoolId = response.schoolId;
		this.parameters = response.parameters;
		this.version = response.version;
	}
}
