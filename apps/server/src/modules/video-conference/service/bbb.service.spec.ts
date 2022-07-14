import { Test, TestingModule } from '@nestjs/testing';
import { BBBService } from '@src/modules/video-conference/service/bbb.service';
import { HttpService } from '@nestjs/axios';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BBBCreateResponse, BBBResponse } from '@src/modules/video-conference/interface/bbb-response.interface';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Logger } from '@src/core/logger';
import { VideoConferenceStatus } from '@src/modules/video-conference/interface/vc-status.enum';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';
import { json2xml } from 'xml-js';
import { BBBCreateConfig, GuestPolicy } from '@src/modules/video-conference/config/bbb-create.config';

const createBBBCreateResponse = (): BBBResponse<BBBCreateResponse> => ({
	response: {
		returncode: VideoConferenceStatus.SUCCESS,
		messageKey: 'messageKey',
		message: 'message',
		meetingID: 'meetingId',
		internalMeetingID: 'internalMeetingID',
		parentMeetingID: 'parentMeetingID',
		createTime: new Date().getTime(),
		voiceBridge: 123,
		dialNumber: '4910790393',
		createDate: '2022-02-15',
		hasUserJoined: false,
		duration: 2333,
		hasBeenForciblyEnded: false,
	},
});

const createBBBCreateConfig = (): BBBCreateConfig => ({
	name: 'config.name',
	meetingID: 'config.meetingID',
	logoutURL: 'config.logoutURL',
	welcome: 'config.welcome',
	guestPolicy: GuestPolicy.ALWAYS_ACCEPT,
	moderatorPW: 'config.moderatorPW',
	attendeePW: 'config.attendeePW',
	allowModsToUnmuteUsers: true,
});

const createAxiosResponse = (data: BBBResponse<BBBCreateResponse>): AxiosResponse<BBBResponse<BBBCreateResponse>> => ({
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	data: json2xml(JSON.stringify(data)) as unknown as BBBResponse<BBBCreateResponse>,
	status: 0,
	statusText: '',
	headers: {},
	config: {},
});

describe('BBB Service', () => {
	let module: TestingModule;
	let service: BBBService;
	let httpService: DeepMocked<HttpService>;
	let logger: DeepMocked<Logger>;

	Configuration.set('VIDEOCONFERENCE_HOST', 'http://bbb.de');
	Configuration.set('VIDEOCONFERENCE_SALT', 'salt12345');

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BBBService,
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();
		service = module.get(BBBService);
		httpService = module.get(HttpService);
		logger = module.get(Logger);
	});

	describe('create', () => {
		let bbbCreateResponse: AxiosResponse<BBBResponse<BBBCreateResponse>>;
		beforeEach(() => {
			bbbCreateResponse = createAxiosResponse(createBBBCreateResponse());
		});

		it('create with returncode success', async () => {
			httpService.get.mockReturnValue(of(bbbCreateResponse));
			const result = await service.create(createBBBCreateConfig());
			expect(result).toBeDefined();
		});
	});
});
