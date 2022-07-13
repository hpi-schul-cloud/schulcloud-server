import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { VideoConferenceController } from '@src/modules/video-conference/controller/video-conference.controller';
import { VideoConferenceUc } from '@src/modules/video-conference/uc/video-conference.uc';
import { Logger } from '@src/core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

describe('VideoConference Controller', () => {
	let module: TestingModule;
	let service: VideoConferenceController;
	let videoConferenceUc: DeepMocked<VideoConferenceUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VideoConferenceController,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				HttpService,
			],
		}).compile();
	});

	describe('create', () => {});
});
