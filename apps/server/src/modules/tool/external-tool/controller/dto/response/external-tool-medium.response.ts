import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExternalToolMediumStatus } from '../../../enum';

export class ExternalToolMediumResponse {
	@ApiProperty({
		description: 'The type of the medium',
		required: true,
		enum: ExternalToolMediumStatus,
		enumName: 'ExternalToolMediumStatus',
	})
	public status: ExternalToolMediumStatus;

	@ApiPropertyOptional({ type: String, description: 'Id of the medium' })
	public mediumId?: string;

	@ApiPropertyOptional({ type: String, description: 'Publisher of the medium' })
	public publisher?: string;

	@ApiPropertyOptional({ type: String, description: 'The id of the media source' })
	public mediaSourceId?: string;

	@ApiPropertyOptional({ type: Date, description: 'The last modified date of the medium' })
	public modifiedAt?: Date;

	constructor(props: ExternalToolMediumResponse) {
		this.status = props.status;
		this.mediumId = props.mediumId;
		this.publisher = props.publisher;
		this.mediaSourceId = props.mediaSourceId;
		this.modifiedAt = props.modifiedAt;
	}
}
