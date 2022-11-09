import { ApiProperty } from '@nestjs/swagger';

export class ExternalToolConfigParams {
	@ApiProperty()
	type!: string;

	@ApiProperty()
	baseUrl!: string;
}
