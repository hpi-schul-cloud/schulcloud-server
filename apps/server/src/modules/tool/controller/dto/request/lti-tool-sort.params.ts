import { SortingParams } from '@shared/controller';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum LtiToolSortOrder {
	ID = 'id',
	NAME = 'name',
	URL = 'url',
	LOGO_URL = 'logo_url',
	LTI_MESSAGE_TYPE = 'lti_message_type',
	LTI_VERSION = 'lti_version',
	RESOURCE_LINK_ID = 'resource_link_id',
	PRIVACY_PERMISSION = 'privacy_permission',
	IS_TEMPLATE = 'isTemplate',
	IS_LOCAL = 'isLocal',
	ORIGIN_TOOL_ID = 'originToolId',
	OAUTH_CLIENT_ID = 'oAuthClientId',
	FRIENDLY_URL = 'friendlyUrl',
	SKIP_CONSENT = 'skipConsent',
	OPEN_NEW_TAB = 'openNewTab',
	FRONTCHANNEL_LOGOUT_URI = 'frontchannel_logout_uri',
	IS_HIDDEN = 'isHidden',
}

export class SortLtiToolParams extends SortingParams<LtiToolSortOrder> {
	@IsOptional()
	@IsEnum(LtiToolSortOrder)
	@ApiPropertyOptional({ enum: LtiToolSortOrder })
	sortBy?: LtiToolSortOrder;
}
