import { EntityId, LtiPrivacyPermission, LtiRoleType } from '@shared/domain';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CustomLtiPropertyParameter } from '@src/modules/tool/controller/dto/request/custom-lti-property.params';
import { Type } from 'class-transformer';

// TODO open api doc
export class LtiToolPostBody {
	@IsString()
	@ApiProperty({ required: true })
	name!: string;

	@IsString()
	@ApiProperty({ required: true })
	url!: string;

	@IsString()
	@ApiProperty({ required: true })
	key!: string;

	@IsString()
	@ApiProperty({ required: false })
	secret!: string;

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
	@ApiProperty({ required: true })
	roles: LtiRoleType[] = [];

	@IsOptional()
	@IsEnum(LtiPrivacyPermission)
	@ApiProperty({ required: false })
	privacy_permission: LtiPrivacyPermission = LtiPrivacyPermission.ANONYMOUS;

	@ValidateNested({ each: true })
	@IsOptional()
	@IsArray()
	@ApiProperty({ required: true })
	@Type(() => CustomLtiPropertyParameter)
	customs: CustomLtiPropertyParameter[] = [];

	@IsBoolean()
	@ApiProperty({ required: true })
	isTemplate!: boolean;

	@IsOptional()
	@IsBoolean()
	@ApiProperty({ required: false })
	isLocal?: boolean;

	@IsOptional()
	@IsMongoId()
	@ApiProperty({ required: false })
	originToolId?: EntityId;

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

	@IsBoolean()
	@ApiProperty({ required: true })
	openNewTab!: boolean;

	@IsOptional()
	@IsString()
	@ApiProperty({ required: false })
	frontchannel_logout_uri?: string;

	@IsOptional()
	@IsBoolean()
	@ApiProperty({ required: true })
	isHidden!: boolean;
}
