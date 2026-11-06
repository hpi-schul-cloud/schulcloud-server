import { Action, AuthorizationService, ForbiddenLoggableException } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { Pagination, Permission } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { Release, ReleasesService } from '../domain';
import { ReleaseImageEntity } from '../entity';

@Injectable()
export class ReleasesUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly releasesService: ReleasesService
	) {}

	public async getReleases(userId: EntityId, pagination?: Pagination): Promise<Counted<Release[]>> {
		await this.checkPermission(userId, Permission.RELEASES_VIEW, Action.read);

		const result = await this.releasesService.getReleases({ pagination });

		return result;
	}

	public async fetchReleases(userId: EntityId): Promise<void> {
		await this.checkPermission(userId, Permission.RELEASES_CREATE, Action.write);

		await this.releasesService.fetchReleases();
	}

	public async getImage(userId: EntityId, imageId: EntityId): Promise<ReleaseImageEntity> {
		await this.checkPermission(userId, Permission.RELEASES_VIEW, Action.read);

		const image = await this.releasesService.getImage(imageId);

		return image;
	}

	private async checkPermission(userId: EntityId, permission: Permission, action: Action): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		if (!this.authorizationService.hasAllPermissions(user, [permission])) {
			throw new ForbiddenLoggableException(userId, 'Release', { action, requiredPermissions: [permission] });
		}
	}
}
