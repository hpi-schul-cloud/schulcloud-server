import { type ExternalToolMedium } from '@modules/tool/external-tool/domain';
import { Inject, Injectable } from '@nestjs/common';
import { type EntityId } from '@shared/domain/types';
import { type MediaGroupLicense } from '../domain';
import { MEDIA_GROUP_LICENSE_REPO, type MediaGroupLicenseRepo } from '../repo';

@Injectable()
export class MediaGroupLicenseService {
	constructor(
		@Inject(MEDIA_GROUP_LICENSE_REPO)
		private readonly mediaGroupLicenseRepo: MediaGroupLicenseRepo
	) {}

	public async findMediaGroupLicensesByGroupIds(groupIds: EntityId[]): Promise<MediaGroupLicense[]> {
		if (!groupIds || groupIds.length === 0) {
			return [];
		}

		return await this.mediaGroupLicenseRepo.findMediaGroupLicensesByGroupIds(groupIds);
	}

	public async findMediaGroupLicensesByGroupId(groupId: EntityId): Promise<MediaGroupLicense[]> {
		return await this.mediaGroupLicenseRepo.findMediaGroupLicensesByGroupId(groupId);
	}

	public async saveAll(licenses: MediaGroupLicense[]): Promise<MediaGroupLicense[]> {
		return await this.mediaGroupLicenseRepo.saveAll(licenses);
	}

	public async delete(licenses: MediaGroupLicense[] | MediaGroupLicense): Promise<void> {
		await this.mediaGroupLicenseRepo.delete(licenses);
	}

	public hasLicenseForExternalTool(
		externalToolMedium: ExternalToolMedium,
		mediaGroupLicenses: MediaGroupLicense[]
	): boolean {
		return mediaGroupLicenses.some(
			(license: MediaGroupLicense) =>
				license.mediumId === externalToolMedium.mediumId &&
				license.mediaSource?.sourceId === externalToolMedium.mediaSourceId
		);
	}
}
