import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ToolConfigurationStatusResponse } from '../../../context-external-tool/controller/dto/tool-configuration-status.response';
import { CustomParameterEntryResponse } from './custom-parameter-entry.response';

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

	@ApiProperty()
	toolVersion: number;

	@ApiProperty({ type: ToolConfigurationStatusResponse })
	status: ToolConfigurationStatusResponse;

	@ApiPropertyOptional()
	logoUrl?: string;

	constructor(response: SchoolExternalToolResponse) {
		this.id = response.id;
		this.name = response.name;
		this.toolId = response.toolId;
		this.schoolId = response.schoolId;
		this.parameters = response.parameters;
		this.toolVersion = response.toolVersion;
		this.status = response.status;
		this.logoUrl = response.logoUrl;
	}
}
