import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MediaSchoolLicenseResponse {
	@ApiProperty()
	public id: string;

	@ApiProperty()
	public schoolId: string;

	@ApiProperty()
	public mediumId: string;

	@ApiPropertyOptional()
	public mediaSourceId?: string;

	@ApiPropertyOptional()
	public mediaSourceName?: string;

	constructor(props: MediaSchoolLicenseResponse) {
		this.id = props.id;
		this.schoolId = props.schoolId;
		this.mediumId = props.mediumId;
		this.mediaSourceId = props.mediaSourceId;
		this.mediaSourceName = props.mediaSourceName;
	}
}
