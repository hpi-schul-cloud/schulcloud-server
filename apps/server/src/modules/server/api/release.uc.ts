import { Action, AuthorizationService, ForbiddenLoggableException } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types/entity-id';
import { Release, ReleaseService } from '../domain';

@Injectable()
export class ReleaseUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly releaseService: ReleaseService
	) {}

	public async getReleases(userId: EntityId, skip?: number, limit?: number): Promise<Release[]> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		if (!this.authorizationService.hasAllPermissions(user, [Permission.RELEASES_VIEW])) {
			throw new ForbiddenLoggableException(userId, 'Release', {
				action: Action.read,
				requiredPermissions: [Permission.RELEASES_VIEW],
			});
		}

		const releases = await this.releaseService.getReleases(skip, limit);

		return releases;
	}
}
