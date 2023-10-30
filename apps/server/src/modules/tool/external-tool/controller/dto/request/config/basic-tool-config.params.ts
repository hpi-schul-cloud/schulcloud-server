import { ApiProperty } from '@nestjs/swagger';
import { ToolConfigType } from '@src/modules/tool/common/enum/tool-config-type.enum';
import { IsEnum, IsString } from 'class-validator';
import { ExternalToolConfigCreateParams } from './external-tool-config.params';

export class BasicToolConfigParams extends ExternalToolConfigCreateParams {
	@IsEnum(ToolConfigType)
	@ApiProperty()
	type!: ToolConfigType;

	@IsString()
	@ApiProperty()
	baseUrl!: string;
}
