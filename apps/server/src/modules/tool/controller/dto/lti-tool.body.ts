import { EntityId, LtiPrivacyPermission, LtiRoleType } from '@shared/domain';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { CustomLtiProperty } from './custom-lti-property.body';

// TODO open api doc
export class LtiToolBody {
	@IsString()
	@ApiProperty()
	name: string;

	@IsString()
	@ApiProperty()
	url: string;

	@IsString()
	@ApiProperty()
	key: string;

	@IsString()
	@ApiProperty()
	secret: string;

	@IsOptional()
	@IsString()
	@ApiProperty()
	logo_url?: string;

	@IsOptional()
	@IsString()
	@ApiProperty()
	lti_message_type?: string;

	@IsOptional()
	@IsString()
	@ApiProperty()
	lti_version?: string;

	@IsOptional()
	@IsString()
	@ApiProperty()
	resource_link_id?: string;

	@IsArray()
	@IsEnum(LtiRoleType, { each: true })
	@ApiProperty()
	roles: LtiRoleType[];

	@IsEnum(LtiPrivacyPermission)
	@ApiProperty()
	privacy_permission: LtiPrivacyPermission;

	@IsArray()
	@ApiProperty()
	customs: CustomLtiProperty[];

	@IsBoolean()
	@ApiProperty()
	isTemplate: boolean;

	@IsOptional()
	@IsBoolean()
	@ApiProperty()
	isLocal?: boolean;

	@IsMongoId()
	@ApiProperty()
	originToolId?: EntityId;

	@IsString()
	@ApiProperty()
	oAuthClientId?: string;

	@IsOptional()
	@IsString()
	@ApiProperty()
	friendlyUrl?: string;

	@IsOptional()
	@IsBoolean()
	@ApiProperty()
	skipConsent?: boolean;

	@IsBoolean()
	@ApiProperty()
	openNewTab: boolean;

	@IsOptional()
	@IsString()
	@ApiProperty()
	frontchannel_logout_uri?: string;

	@IsOptional()
	@IsBoolean()
	@ApiProperty()
	isHidden: boolean;

	constructor(props: LtiToolBody) {
		this.secret = props.secret;
		this.name = props.name;
		this.url = props.url;
		this.key = props.key;
		this.logo_url = props.logo_url;
		this.lti_message_type = props.lti_message_type;
		this.lti_version = props.lti_version;
		this.resource_link_id = props.resource_link_id;
		this.roles = props.roles;
		this.privacy_permission = props.privacy_permission;
		this.customs = props.customs;
		this.isTemplate = props.isTemplate;
		this.isLocal = props.isLocal;
		this.originToolId = props.originToolId;
		this.oAuthClientId = props.oAuthClientId;
		this.friendlyUrl = props.friendlyUrl;
		this.skipConsent = props.skipConsent;
		this.openNewTab = props.openNewTab;
		this.frontchannel_logout_uri = props.frontchannel_logout_uri;
		this.isHidden = props.isHidden;
	}
}
