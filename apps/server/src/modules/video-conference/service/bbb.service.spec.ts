import { Test, TestingModule } from '@nestjs/testing';
import { BBBService } from '@src/modules/video-conference/service/bbb.service';
import { HttpService } from '@nestjs/axios';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';
import { BBBCreateConfig, GuestPolicy } from '@src/modules/video-conference/config/bbb-create.config';
import { ConverterUtil } from '@shared/common';
import {
	BBBCreateResponse,
	BBBMeetingInfoResponse,
	BBBResponse,
} from '@src/modules/video-conference/interface/bbb-response.interface';
import { VideoConferenceStatus } from '@src/modules/video-conference/interface/vc-status.enum';
import { InternalServerErrorException } from '@nestjs/common';
import { BBBJoinConfig, BBBRole } from '@src/modules/video-conference/config/bbb-join.config';
import { URLSearchParams } from 'url';
import crypto from 'crypto';

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

const createBBBMeetingInfoResponse = (): BBBResponse<BBBMeetingInfoResponse> =>
	({
		response: {
			parentMeetingID: 'parentMeetingID',
			meetingName: 'meetingName',
			meetingID: 'meetingID',
		},
	} as unknown as BBBResponse<BBBMeetingInfoResponse>);

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

const createBBBJoinConfig = (): BBBJoinConfig => ({
	meetingID: 'config.meetingID',
	fullName: 'fullName',
	role: BBBRole.MODERATOR,
	userID: 'userID',
	guest: false,
	redirect: 'redirect',
});

const createAxiosResponse = (
	data: BBBResponse<BBBCreateResponse | BBBMeetingInfoResponse>
): AxiosResponse<BBBResponse<BBBCreateResponse | BBBMeetingInfoResponse>> => ({
	data: data ?? {},
	status: 0,
	statusText: '',
	headers: {},
	config: {},
});

class BBBServiceTest extends BBBService {
	public toParams(object: object): URLSearchParams {
		return this.toParams(object);
	}

	public getUrl(callName: string, queryParams: URLSearchParams): string {
		return this.getUrl(callName, queryParams);
	}

	public getBaseUrl(): string {
		return Configuration.get('VIDEOCONFERENCE_HOST') as string;
	}

	public getSalt(): string {
		return Configuration.get('VIDEOCONFERENCE_HOST') as string;
	}

	public generateChecksum(callName: string, queryParams: URLSearchParams): string {
		return this.generateChecksum(callName, queryParams);
	}
}

describe('BBB Service', () => {
	let module: TestingModule;
	let service: BBBServiceTest;
	let httpService: DeepMocked<HttpService>;
	let converterUtil: DeepMocked<ConverterUtil>;

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
					provide: ConverterUtil,
					useValue: createMock<ConverterUtil>(),
				},
			],
		}).compile();
		service = module.get(BBBService);
		httpService = module.get(HttpService);
		converterUtil = module.get(ConverterUtil);
	});

	describe('create', () => {
		let bbbCreateResponse: AxiosResponse<BBBResponse<BBBCreateResponse | BBBMeetingInfoResponse>>;
		beforeEach(() => {
			bbbCreateResponse = createAxiosResponse(createBBBCreateResponse());
		});

		it('should return a response with returncode success', async () => {
			// Arrange
			httpService.get.mockReturnValue(of(bbbCreateResponse));
			converterUtil.xml2object.mockReturnValue(bbbCreateResponse.data);

			// Act
			const result = await service.create(createBBBCreateConfig());

			// Assert
			expect(result).toBeDefined();
		});

		it('should throw an error if there is a different return code then success', async () => {
			// Arrange
			bbbCreateResponse.data.response.returncode = VideoConferenceStatus.ERROR;
			httpService.get.mockReturnValue(of(bbbCreateResponse));
			converterUtil.xml2object.mockReturnValue(bbbCreateResponse.data);
			const expectedError = new InternalServerErrorException(
				bbbCreateResponse.data.response.messageKey,
				bbbCreateResponse.data.response.message
			);

			// Act && Assert
			await expect(service.create(createBBBCreateConfig())).rejects.toThrowError(expectedError);
		});
	});

	describe('join', () => {
		let bbbMeetingInfoResponse: AxiosResponse<BBBResponse<BBBCreateResponse | BBBMeetingInfoResponse>>;
		beforeEach(() => {
			bbbMeetingInfoResponse = createAxiosResponse(createBBBMeetingInfoResponse());
		});

		it('should create a join link to a bbb meeting', async () => {
			// Arrange
			const config = createBBBJoinConfig();
			httpService.get.mockReturnValue(of(bbbMeetingInfoResponse));
			converterUtil.xml2object.mockReturnValue(bbbMeetingInfoResponse.data);

			// Act
			const url = await service.join(config);

			// Assert
			expect(url).toBeDefined();
		});

		// TODO: end - sehr aehnlich zu create
		// TODO: getMeetingInfo - sehr aehnlich zu create

		it('toParams: should return params based on bbb configs', () => {
			// Arrange
			const createConfig = createBBBCreateConfig();

			// Act
			const params: URLSearchParams = service.toParams(createConfig);

			// Assert
			expect(params.get('name')).toEqual(createConfig.name);
			expect(params.get('meetingID')).toEqual(createConfig.meetingID);
			expect(params.get('logoutURL')).toEqual(createConfig.logoutURL);
			expect(params.get('welcome')).toEqual(createConfig.welcome);
			expect(params.get('guestPolicy')).toEqual(createConfig.guestPolicy?.toString());
			expect(params.get('moderatorPW')).toEqual(createConfig.moderatorPW);
			expect(params.get('attendeePW')).toEqual(createConfig.attendeePW);
			expect(params.get('allowModsToUnmuteUsers')).toEqual(String(createConfig.allowModsToUnmuteUsers));
		});

		it('generateChecksum: should generate a checksum for queryParams', () => {
			// Arrange
			const createConfig: BBBCreateConfig = createBBBCreateConfig();
			const callName = 'create';
			const urlSearchParams: URLSearchParams = service.toParams(createConfig);
			const queryString: string = urlSearchParams.toString();
			const sha = crypto.createHash('sha1');
			const expectedChecksum: string = sha.update(callName + queryString + service.getSalt()).digest('hex');

			// Act
			const checksum: string = service.generateChecksum(callName, urlSearchParams);

			// Assert
			expect(checksum).toEqual(expectedChecksum);
		});

		it('getUrl: should return composed url', () => {
			// Arrange
			const createConfig = createBBBCreateConfig();
			const callName = 'create';
			const params: URLSearchParams = service.toParams(createConfig);

			// Act
			const url: string = service.getUrl(callName, params);

			// Assert
			expect(url.toString()).toEqual(`http://${service.getBaseUrl()}/bigbluebutton/api/${callName}`);
			expect(url.includes('checksum')).toBeTruthy();
		});
	});
});
