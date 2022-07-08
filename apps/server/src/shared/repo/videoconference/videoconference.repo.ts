import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { VideoConference } from '@shared/domain/entity/video-conference.entity';
import { BaseRepo } from '../base.repo';

@Injectable()
export class VideoconferenceRepo extends BaseRepo<VideoConference> {
	get entityName() {
		return VideoConference;
	}

	cacheExpiration = 60000;

	async findById(id: EntityId): Promise<VideoConference> {
		const videoconference = await this._em.findOneOrFail(VideoConference, { id }, { cache: this.cacheExpiration });

		return videoconference;
	}
}
