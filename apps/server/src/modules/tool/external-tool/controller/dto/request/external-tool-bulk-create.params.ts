import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { ExternalToolCreateParams } from './external-tool-create.params';

export class ExternalToolBulkCreateParams {
	@ValidateNested()
	@Type(() => ExternalToolCreateParams)
	@ApiProperty({ type: [ExternalToolCreateParams], description: 'List of external tools' })
	data!: ExternalToolCreateParams[];
}
