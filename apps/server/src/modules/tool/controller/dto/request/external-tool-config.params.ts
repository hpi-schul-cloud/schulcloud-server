import { ApiProperty } from '@nestjs/swagger';
import { ToolConfigType } from '@shared/domain';

export class ExternalToolConfigCreateParams {
	@ApiProperty()
	type!: ToolConfigType;

	@ApiProperty()
	baseUrl!: string;
}
