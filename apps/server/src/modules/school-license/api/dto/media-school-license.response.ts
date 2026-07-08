import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MediaSchoolLicenseResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	schoolId: string;

	@ApiProperty()
	mediumId: string;

	@ApiPropertyOptional()
	mediaSourceId?: string;

	@ApiPropertyOptional()
	mediaSourceName?: string;

	constructor(props: MediaSchoolLicenseResponse) {
		this.id = props.id;
		this.schoolId = props.schoolId;
		this.mediumId = props.mediumId;
		this.mediaSourceId = props.mediaSourceId;
		this.mediaSourceName = props.mediaSourceName;
	}
}
