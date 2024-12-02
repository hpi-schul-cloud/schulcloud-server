import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ToolContextType } from '../../../common/enum';
import { CustomParameterEntryResponse } from '../../../school-external-tool/controller/dto';

export class ContextExternalToolResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	schoolToolId: string;

	@ApiProperty()
	contextId: string;

	@ApiProperty({ enum: ToolContextType })
	contextType: ToolContextType;

	@ApiPropertyOptional()
	displayName?: string;

	@ApiProperty({ type: [CustomParameterEntryResponse] })
	parameters: CustomParameterEntryResponse[] = [];

	constructor(response: ContextExternalToolResponse) {
		this.id = response.id;
		this.schoolToolId = response.schoolToolId;
		this.contextId = response.contextId;
		this.contextType = response.contextType;
		this.displayName = response.displayName;
		this.parameters = response.parameters;
	}
}
