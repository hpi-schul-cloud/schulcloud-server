import { SortingParams } from '@shared/controller';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortOrder } from '@shared/domain/interface';

export enum LtiToolSortOrder {
	NAME = 'name',
	URL = 'url',
	KEY = 'key',
	SECRET = 'secret',
	LOGO_URL = 'logo_url',
	LTI_MESSAGE_TYPE = 'lti_message_type',
	LTI_VERSION = 'lti_version',
	RESOURCE_LINK_ID = 'resource_link_id',
	ROLES = 'roles',
	PRIVACY_PERMISSION = 'privacy_permission',
	CUSTOMS = 'customs',
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

	constructor(sortOrder: SortOrder, sortBy?: LtiToolSortOrder) {
		super(sortOrder);
		this.sortBy = sortBy;
	}
}
