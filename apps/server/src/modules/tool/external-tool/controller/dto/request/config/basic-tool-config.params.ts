import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUrl } from 'class-validator';
import { ToolConfigType } from '../../../../../common/enum';
import { ExternalToolConfigCreateParams } from './external-tool-config.params';

export class BasicToolConfigParams extends ExternalToolConfigCreateParams {
	@IsEnum(ToolConfigType)
	@ApiProperty()
	type!: ToolConfigType;

	@IsUrl(
		{ require_protocol: true, protocols: ['https'] },
		{ message: 'baseUrl must be a URL address with https protocol' }
	)
	@ApiProperty()
	baseUrl!: string;
}
