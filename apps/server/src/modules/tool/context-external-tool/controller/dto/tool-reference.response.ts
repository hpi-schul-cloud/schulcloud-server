import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContextExternalToolConfigurationStatusResponse } from '../../../common/controller/dto';

export class ToolReferenceResponse {
	@ApiProperty({ nullable: false, required: true, description: 'The id of the tool in the context' })
	contextToolId: string;

	@ApiPropertyOptional({ description: 'The description of the tool' })
	description?: string;

	@ApiPropertyOptional({
		nullable: false,
		required: false,
		description: 'The url of the logo which is stored in the db',
	})
	logoUrl?: string;

	@ApiPropertyOptional({
		nullable: false,
		required: false,
		description: 'The url of the thumbnail which is stored in the db',
	})
	thumbnailUrl?: string;

	@ApiProperty({ nullable: false, required: true, description: 'The display name of the tool' })
	displayName: string;

	@ApiProperty({ nullable: false, required: true, description: 'Whether the tool should be opened in a new tab' })
	openInNewTab: boolean;

	@ApiProperty({
		type: ContextExternalToolConfigurationStatusResponse,
		nullable: false,
		required: true,
		description: 'The status of the tool',
	})
	status: ContextExternalToolConfigurationStatusResponse;

	constructor(toolReferenceResponse: ToolReferenceResponse) {
		this.contextToolId = toolReferenceResponse.contextToolId;
		this.description = toolReferenceResponse.description;
		this.logoUrl = toolReferenceResponse.logoUrl;
		this.thumbnailUrl = toolReferenceResponse.thumbnailUrl;
		this.displayName = toolReferenceResponse.displayName;
		this.openInNewTab = toolReferenceResponse.openInNewTab;
		this.status = toolReferenceResponse.status;
	}
}
