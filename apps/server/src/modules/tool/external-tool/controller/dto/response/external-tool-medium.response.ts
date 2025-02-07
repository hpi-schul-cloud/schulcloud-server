import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExternalToolMediumResponse {
	@ApiProperty({ type: String, description: 'Id of the medium' })
	public mediumId!: string;

	@ApiPropertyOptional({ type: String, description: 'Publisher of the medium' })
	public publisher?: string;

	@ApiPropertyOptional({ type: String, description: 'The id of the media source' })
	public mediaSourceId?: string;

	constructor(props: ExternalToolMediumResponse) {
		this.mediumId = props.mediumId;
		this.publisher = props.publisher;
		this.mediaSourceId = props.mediaSourceId;
	}
}
