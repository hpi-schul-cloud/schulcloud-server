import { EntityId, LtiPrivacyPermission, LtiRoleType } from '@shared/domain';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CustomLtiPropertyParameter } from '@src/modules/tool/controller/dto/request/custom-lti-property.params';

export class LtiToolPatchBody {
	@IsOptional()
	@IsString()
	@ApiProperty({ required: false })
	name?: string;

	@IsOptional()
	@IsString()
	@ApiProperty({ required: false })
	url?: string;

	@IsOptional()
	@IsString()
	@ApiProperty({ required: false })
	key?: string;

	@IsOptional()
	@IsString()
	@ApiProperty({ required: false })
	secret?: string;

	@IsOptional()
	@IsString()
	@ApiProperty({ required: false })
	logo_url?: string;

	@IsOptional()
	@IsString()
	@ApiProperty({ required: false })
	lti_message_type?: string;

	@IsOptional()
	@IsString()
	@ApiProperty({ required: false })
	lti_version?: string;

	@IsOptional()
	@IsString()
	@ApiProperty({ required: false })
	resource_link_id?: string;

	@IsOptional()
	@IsArray()
	@IsEnum(LtiRoleType, { each: true })
	@ApiProperty({ required: false })
	roles?: LtiRoleType[];

	@IsOptional()
	@IsEnum(LtiPrivacyPermission)
	@ApiProperty({ required: false })
	privacy_permission?: LtiPrivacyPermission;

	@ValidateNested({ each: true })
	@IsOptional()
	@IsArray()
	@ApiProperty({ required: false })
	customs?: CustomLtiPropertyParameter[];

	@IsOptional()
	@IsBoolean()
	@ApiProperty({ required: false })
	isTemplate?: boolean;

	@IsOptional()
	@IsBoolean()
	@ApiProperty({ required: false })
	isLocal?: boolean;

	@IsOptional()
	@IsMongoId()
	@ApiProperty({ required: false })
	originToolId?: EntityId;

	@IsOptional()
	@IsString()
	@ApiProperty({ required: false })
	oAuthClientId?: string;

	@IsOptional()
	@IsString()
	@ApiProperty({ required: false })
	friendlyUrl?: string;

	@IsOptional()
	@IsBoolean()
	@ApiProperty({ required: false })
	skipConsent?: boolean;

	@IsOptional()
	@IsBoolean()
	@ApiProperty({ required: false })
	openNewTab?: boolean;

	@IsOptional()
	@IsString()
	@ApiProperty({ required: false })
	frontchannel_logout_uri?: string;

	@IsOptional()
	@IsBoolean()
	@ApiProperty({ required: false })
	isHidden?: boolean;
}
