import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { MediaUserLicense } from '../domain';
import { MediaUserLicenseRepo } from '../repo';

@Injectable()
export class UserLicenseService {
	constructor(private readonly userLicenseRepo: MediaUserLicenseRepo) {}

	public async getMediaUserLicensesForUser(userId: EntityId): Promise<MediaUserLicense[]> {
		const mediaUserLicenses: MediaUserLicense[] = await this.userLicenseRepo.findMediaUserLicensesForUser(userId);

		return mediaUserLicenses;
	}

	public async saveUserLicense(license: MediaUserLicense): Promise<void> {
		await this.userLicenseRepo.save(license);
	}

	public async deleteUserLicense(license: MediaUserLicense): Promise<void> {
		await this.userLicenseRepo.delete(license);
	}
}
