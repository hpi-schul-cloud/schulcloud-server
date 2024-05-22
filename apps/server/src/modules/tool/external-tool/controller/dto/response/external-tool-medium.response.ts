import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExternalToolMediumResponse {
	@ApiProperty({ type: String, description: 'Id of the medium' })
	mediumId!: string;

	@ApiPropertyOptional({ type: String, description: 'Publisher of the medium' })
	publisher?: string;

	@ApiPropertyOptional({ type: String, description: 'The id of the media source' })
	mediaSourceId?: string;

	constructor(props: ExternalToolMediumResponse) {
		this.mediumId = props.mediumId;
		this.publisher = props.publisher;
		this.mediaSourceId = props.mediaSourceId;
	}
}
