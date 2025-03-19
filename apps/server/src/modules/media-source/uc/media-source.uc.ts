import { AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { MediaSource } from '../do';
import { MediaSourceService } from '../service';

@Injectable()
export class MediaSourceUc {
	constructor(
		private readonly mediaSourceService: MediaSourceService,
		private readonly authorizationService: AuthorizationService
	) {}

	public async getMediaSourceList(userId: EntityId): Promise<MediaSource[]> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [Permission.MEDIA_SOURCE_ADMIN]);

		const mediaSources: MediaSource[] = await this.mediaSourceService.getAllMediaSources();

		return mediaSources;
	}
}
