import { MediaUserLicense } from '@modules/user-license';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MediaUserLicenseService {
	public hasLicenseForExternalTool(externalToolMediumId: string, mediaUserLicenses: MediaUserLicense[]): boolean {
		return mediaUserLicenses.some((license: MediaUserLicense) => license.mediumId === externalToolMediumId);
	}
}
