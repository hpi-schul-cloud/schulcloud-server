import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ToolContextType } from '../../../interface';
import { CustomParameterEntryResponse } from './custom-parameter-entry.response';

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

	@ApiProperty()
	toolVersion: number;

	@ApiPropertyOptional()
	logoUrl?: string;

	constructor(response: ContextExternalToolResponse) {
		this.id = response.id;
		this.schoolToolId = response.schoolToolId;
		this.contextId = response.contextId;
		this.contextType = response.contextType;
		this.displayName = response.displayName;
		this.parameters = response.parameters;
		this.toolVersion = response.toolVersion;
		this.logoUrl = response.logoUrl;
	}
}
