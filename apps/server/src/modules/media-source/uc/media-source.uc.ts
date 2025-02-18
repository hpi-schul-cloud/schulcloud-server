import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { AuthorizationService } from '../../authorization';
import { MediaSource } from '../do';
import { MediaSourceService } from '../service';

export class MediaSourceUc {
	constructor(
		private readonly mediaSourceService: MediaSourceService,
		private readonly authorizationService: AuthorizationService
	) {}

	public async getMediaSourceList(currentUserId: EntityId): Promise<MediaSource[]> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUserId);

		this.authorizationService.checkAllPermissions(user, [Permission.MEDIA_SOURCE_ADMIN]);

		const mediaSources: MediaSource[] = await this.mediaSourceService.getAllMediaSources();

		return mediaSources;
	}
}
