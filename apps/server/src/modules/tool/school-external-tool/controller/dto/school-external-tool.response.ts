import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomParameterEntryResponse } from './custom-parameter-entry.response';
import { ToolConfigurationStatusResponse } from '../../../external-tool/controller/dto';

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

	@ApiProperty({ enum: ToolConfigurationStatusResponse })
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
