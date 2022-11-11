import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';
import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExternalToolConfigCreateParams } from './external-tool-config.params';

export class BasicToolConfigParams extends ExternalToolConfigCreateParams {
	@IsEnum(ToolConfigType)
	@ApiProperty()
	type!: ToolConfigType;

	@IsString()
	@ApiProperty()
	baseUrl!: string;
}
