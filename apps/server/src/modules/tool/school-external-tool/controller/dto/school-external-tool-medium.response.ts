import { MediaSourceLicenseType } from '@modules/media-source';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SchoolExternalToolMediumResponse {
	@ApiProperty({ description: 'Id of the medium' })
	public mediumId: string;

	@ApiPropertyOptional({ description: 'The id of the media source' })
	public mediaSourceId?: string;

	@ApiPropertyOptional({ description: 'Name of the media source' })
	public mediaSourceName?: string;

	@ApiPropertyOptional({
		enum: MediaSourceLicenseType,
		enumName: 'MediaSourceLicenseType',
		description: 'License type of the media source',
	})
	public mediaSourceLicenseType?: MediaSourceLicenseType;

	constructor(props: SchoolExternalToolMediumResponse) {
		this.mediaSourceName = props.mediaSourceName;
		this.mediumId = props.mediumId;
		this.mediaSourceId = props.mediaSourceId;
		this.mediaSourceLicenseType = props.mediaSourceLicenseType;
	}
}
