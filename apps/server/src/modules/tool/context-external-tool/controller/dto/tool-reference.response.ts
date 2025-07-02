import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContextExternalToolConfigurationStatusResponse } from '../../../common/controller/dto';
import { LtiDeepLinkResponse } from './lti11-deep-link';

export class ToolReferenceResponse {
	@ApiProperty({ description: 'The id of the tool in the context' })
	contextToolId: string;

	@ApiPropertyOptional({ description: 'The description of the tool' })
	description?: string;

	@ApiPropertyOptional({
		description: 'The url of the logo which is stored in the db',
	})
	logoUrl?: string;

	@ApiPropertyOptional({
		description: 'The url of the thumbnail which is stored in the db',
	})
	thumbnailUrl?: string;

	@ApiProperty({ description: 'The display name of the tool' })
	displayName: string;

	@ApiProperty({ description: 'The domain of the tool url' })
	domain: string;

	@ApiProperty({ description: 'Whether the tool should be opened in a new tab' })
	openInNewTab: boolean;

	@ApiProperty({
		type: ContextExternalToolConfigurationStatusResponse,
		description: 'The status of the tool',
	})
	status: ContextExternalToolConfigurationStatusResponse;

	@ApiProperty({ description: 'Whether the tool is a lti deep linking tool' })
	isLtiDeepLinkingTool: boolean;

	@ApiPropertyOptional({ type: LtiDeepLinkResponse })
	ltiDeepLink?: LtiDeepLinkResponse;

	constructor(toolReferenceResponse: ToolReferenceResponse) {
		this.contextToolId = toolReferenceResponse.contextToolId;
		this.description = toolReferenceResponse.description;
		this.logoUrl = toolReferenceResponse.logoUrl;
		this.thumbnailUrl = toolReferenceResponse.thumbnailUrl;
		this.displayName = toolReferenceResponse.displayName;
		this.openInNewTab = toolReferenceResponse.openInNewTab;
		this.status = toolReferenceResponse.status;
		this.isLtiDeepLinkingTool = toolReferenceResponse.isLtiDeepLinkingTool;
		this.ltiDeepLink = toolReferenceResponse.ltiDeepLink;
		this.domain = toolReferenceResponse.domain;
	}
}
