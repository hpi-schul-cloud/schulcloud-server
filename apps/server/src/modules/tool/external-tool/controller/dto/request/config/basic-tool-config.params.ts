import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUrl } from 'class-validator';
import { ToolConfigType } from '../../../../../common/enum';
import { ExternalToolConfigCreateParams } from './external-tool-config.params';

export class BasicToolConfigParams extends ExternalToolConfigCreateParams {
	@IsEnum(ToolConfigType)
	@ApiProperty({
		enum: ToolConfigType,
		enumName: 'ToolConfigType',
		description: 'Configuration type of the tool.',
		example: ToolConfigType.BASIC,
	})
	public type!: ToolConfigType;

	@IsUrl(
		{ require_protocol: true, protocols: ['https'] },
		{ message: 'baseUrl must be a URL address with https protocol' }
	)
	@ApiProperty({
		description:
			'Defines the target URL that is launched. Can be automatically filled with parameter values when using : in-front of the parameter name. Must be HTTPS.',
		example: 'https://example.com/:parameter1/test',
	})
	public baseUrl!: string;
}
