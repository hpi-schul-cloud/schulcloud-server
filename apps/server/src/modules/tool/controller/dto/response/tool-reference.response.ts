import { ApiProperty } from '@nestjs/swagger';
import { ToolConfigurationStatusResponse } from './tool-configuration-status.response';

export class ToolReferenceResponse {
	@ApiProperty({ nullable: false, required: true, description: 'The id of the tool in the context' })
	contextToolId: string;

	@ApiProperty({ nullable: true, required: false, description: 'The url of the logo of the tool' })
	logoUrl?: string;

	@ApiProperty({ nullable: false, required: true, description: 'The display name of the tool' })
	displayName: string;

	@ApiProperty({ nullable: false, required: true, description: 'Whether the tool should be opened in a new tab' })
	openInNewTab: boolean;

	@ApiProperty({
		enum: ToolConfigurationStatusResponse,
		nullable: false,
		required: true,
		description: 'The status of the tool',
	})
	status: ToolConfigurationStatusResponse;

	constructor(toolReferenceResponse: ToolReferenceResponse) {
		this.contextToolId = toolReferenceResponse.contextToolId;
		this.logoUrl = toolReferenceResponse.logoUrl;
		this.displayName = toolReferenceResponse.displayName;
		this.openInNewTab = toolReferenceResponse.openInNewTab;
		this.status = toolReferenceResponse.status;
	}
}
