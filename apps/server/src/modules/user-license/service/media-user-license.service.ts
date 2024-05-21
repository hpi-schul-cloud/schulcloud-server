import { ExternalToolMedium } from '@modules/tool/external-tool/domain';
import { MediaUserLicense } from '@modules/user-license';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MediaUserLicenseService {
	public hasLicenseForExternalTool(
		externalToolMedium: ExternalToolMedium,
		mediaUserLicenses: MediaUserLicense[]
	): boolean {
		return mediaUserLicenses.some(
			(license: MediaUserLicense) =>
				license.mediumId === externalToolMedium.mediumId && license.mediaSourceId === externalToolMedium.mediaSourceId
		);
	}
}
