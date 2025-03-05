import { ApiProperty } from '@nestjs/swagger';

export class ExternalToolMetadataParams {
	@ApiProperty({ nullable: false, required: true })
	mediumId!: string;

	@ApiProperty({ nullable: false, required: true })
	mediaSourceId!: string;
}
