import { ApiProperty } from '@nestjs/swagger';

export class ExternalToolConfigCreateParams {
	@ApiProperty()
	type!: string;

	@ApiProperty()
	baseUrl!: string;
}
