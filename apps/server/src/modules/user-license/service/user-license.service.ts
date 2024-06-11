import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { MediaUserLicense } from '../domain';
import { UserLicenseRepo } from '../repo';

@Injectable()
export class UserLicenseService {
	constructor(private readonly userLicenseRepo: UserLicenseRepo) {}

	public async getMediaUserLicensesForUser(userId: EntityId): Promise<MediaUserLicense[]> {
		const mediaUserLicenses: MediaUserLicense[] = await this.userLicenseRepo.findMediaUserLicenses({
			userId,
		});

		return mediaUserLicenses;
	}

	public async saveUserLicense(license: MediaUserLicense): Promise<void> {
		await this.userLicenseRepo.saveUserLicense(license);
	}

	public async deleteUserLicense(license: MediaUserLicense): Promise<void> {
		await this.userLicenseRepo.deleteUserLicense(license);
	}
}
