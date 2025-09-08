import { MediaSchoolLicense } from '../../domain';
import { MediaSchoolLicenseListResponse, MediaSchoolLicenseResponse } from '../dto';

export class MediaSchoolLicenseResponseMapper {
	public static mapMediaSchoolLicensesToListResponse(licenses: MediaSchoolLicense[]): MediaSchoolLicenseListResponse {
		const licenseResponses: MediaSchoolLicenseResponse[] = licenses.map((license: MediaSchoolLicense) =>
			MediaSchoolLicenseResponseMapper.mapMediaSchoolLicenseToResponse(license)
		);

		const listResponse: MediaSchoolLicenseListResponse = new MediaSchoolLicenseListResponse({
			data: licenseResponses,
		});

		return listResponse;
	}

	public static mapMediaSchoolLicenseToResponse(license: MediaSchoolLicense): MediaSchoolLicenseResponse {
		const licenseResponse: MediaSchoolLicenseResponse = new MediaSchoolLicenseResponse({
			id: license.id,
			schoolId: license.schoolId,
			mediumId: license.mediumId,
			mediaSourceId: license.mediaSource?.sourceId,
			mediaSourceName: license.mediaSource?.name,
		});

		return licenseResponse;
	}
}
