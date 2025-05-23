import { MediaSourceLicenseType } from '@modules/media-source';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExternalToolMediumStatus } from '../../../external-tool/enum';

export class SchoolExternalToolMediumResponse {
	@ApiProperty({
		description: 'The type of the medium',
		required: true,
		enum: ExternalToolMediumStatus,
		enumName: 'ExternalToolMediumStatus',
	})
	public status: ExternalToolMediumStatus;

	@ApiPropertyOptional({ description: 'Id of the medium' })
	public mediumId?: string;

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
		this.status = props.status;
		this.mediaSourceName = props.mediaSourceName;
		this.mediumId = props.mediumId;
		this.mediaSourceId = props.mediaSourceId;
		this.mediaSourceLicenseType = props.mediaSourceLicenseType;
	}
}
