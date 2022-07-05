import { Injectable } from '@nestjs/common';
import { VideoConferenceService } from '@src/modules/video-conference/service/video-conference.service';
import { BBBCreateConfig } from '@src/modules/video-conference/config/bbb-create.config';
import { BBBJoinConfig } from '@src/modules/video-conference/config/bbb-join.config';
import { BBBEndConfig } from '@src/modules/video-conference/config/bbb-end.config';

@Injectable()
export class VideoConferenceUc {
	constructor(private readonly videoConferenceService: VideoConferenceService) {}

	create(): unknown {
		return this.videoConferenceService.create(
			new BBBCreateConfig({
				meetingID: '',
				name: '',
			})
		);
	}

	join(): unknown {
		return this.videoConferenceService.join(
			new BBBJoinConfig({
				fullName: '',
				meetingID: '',
				role: '',
			})
		);
	}

	end(): unknown {
		return this.videoConferenceService.end(
			new BBBEndConfig({
				meetingID: '',
			})
		);
	}
}
