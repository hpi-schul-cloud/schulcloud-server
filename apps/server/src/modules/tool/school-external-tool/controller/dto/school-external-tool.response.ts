import { ToolContextType } from '@modules/tool/common/enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomParameterEntryResponse } from './custom-parameter-entry.response';
import { SchoolExternalToolConfigurationStatusResponse } from './school-external-tool-configuration.response';
import { SchoolExternalToolMediumResponse } from './school-external-tool-medium.response';

export class SchoolExternalToolResponse {
	@ApiProperty()
	public id: string;

	@ApiProperty()
	public name: string;

	@ApiProperty()
	public toolId: string;

	@ApiProperty()
	public schoolId: string;

	@ApiProperty()
	public isDeactivated: boolean;

	@ApiProperty({ type: [CustomParameterEntryResponse] })
	public parameters: CustomParameterEntryResponse[];

	@ApiProperty({ type: SchoolExternalToolConfigurationStatusResponse })
	public status: SchoolExternalToolConfigurationStatusResponse;

	@ApiPropertyOptional({ enum: ToolContextType, enumName: 'ToolContextType', isArray: true })
	public restrictToContexts?: ToolContextType[];

	@ApiPropertyOptional({ type: SchoolExternalToolMediumResponse })
	public medium?: SchoolExternalToolMediumResponse;

	constructor(response: SchoolExternalToolResponse) {
		this.id = response.id;
		this.name = response.name;
		this.toolId = response.toolId;
		this.schoolId = response.schoolId;
		this.isDeactivated = response.isDeactivated;
		this.parameters = response.parameters;
		this.status = response.status;
		this.restrictToContexts = response.restrictToContexts;
		this.medium = response.medium;
	}
}
