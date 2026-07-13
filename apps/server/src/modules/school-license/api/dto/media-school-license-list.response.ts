import { ApiProperty } from '@nestjs/swagger';
import { MediaSchoolLicenseResponse } from './media-school-license.response';

export class MediaSchoolLicenseListResponse {
	@ApiProperty({ type: MediaSchoolLicenseResponse, isArray: true })
	data: MediaSchoolLicenseResponse[];

	constructor(props: MediaSchoolLicenseListResponse) {
		this.data = props.data;
	}
}
