import { IsBoolean, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CustomParameterCreateParams } from '@src/modules/tool/controller/dto/request/custom-parameter.params';
import { BasicToolConfigParams } from '@src/modules/tool/controller/dto/request/basic-tool-config.params';
import { Lti11ToolConfigParams } from '@src/modules/tool/controller/dto/request/lti11-tool-config.params';
import { Oauth2ToolConfigParams } from '@src/modules/tool/controller/dto/request/oauth2-tool-config.params';

export class ExternalToolParams {
	@IsString()
	@ApiProperty()
	name!: string;

	@IsString()
	@ApiProperty()
	url!: string;

	@IsString()
	@ApiProperty()
	logoUrl?: string;

	@ApiProperty()
	config!: BasicToolConfigParams | Lti11ToolConfigParams | Oauth2ToolConfigParams;

	@ApiProperty()
	parameters?: CustomParameterCreateParams[];

	@IsBoolean()
	@ApiProperty()
	isHidden!: boolean;

	@IsBoolean()
	@ApiProperty()
	openNewTab!: boolean;

	@ApiProperty()
	version!: number;
}
