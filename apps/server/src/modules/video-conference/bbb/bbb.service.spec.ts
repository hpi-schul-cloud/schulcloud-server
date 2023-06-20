import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConverterUtil } from '@shared/common';
import { AxiosResponse } from 'axios';
import crypto, { Hash } from 'crypto';
import { of } from 'rxjs';
import { URLSearchParams } from 'url';
import { BBBBaseMeetingConfig, BBBCreateConfig, BBBJoinConfig, BBBRole, GuestPolicy } from './request';
import { BBBService } from './bbb.service';
import { BBBBaseResponse, BBBCreateResponse, BBBMeetingInfoResponse, BBBResponse, BBBStatus } from './response';
import { BbbSettings, IBbbSettings } from './bbb-settings.interface';

const createBBBCreateResponse = (): BBBResponse<BBBCreateResponse> => {
	return {
		response: {
			returncode: BBBStatus.SUCCESS,
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
	};
};

const createBBBBaseResponse = (): BBBResponse<BBBBaseResponse> => {
	return {
		response: {
			returncode: BBBStatus.SUCCESS,
			messageKey: 'messageKey',
			message: 'message',
		},
	};
};

const createBBBMeetingInfoResponse = (): BBBResponse<BBBMeetingInfoResponse> =>
	({
		response: {
			returncode: BBBStatus.SUCCESS,
			parentMeetingID: 'parentMeetingID',
			meetingName: 'meetingName',
			meetingID: 'meetingID',
		},
	} as unknown as BBBResponse<BBBMeetingInfoResponse>);

const createBBBCreateConfig = (): BBBCreateConfig => {
	return {
		name: 'config.name',
		meetingID: 'config.meetingID',
		logoutURL: 'config.logoutURL',
		welcome: 'config.welcome',
		guestPolicy: GuestPolicy.ALWAYS_ACCEPT,
		moderatorPW: 'config.moderatorPW',
		attendeePW: 'config.attendeePW',
		allowModsToUnmuteUsers: true,
	};
};

const createBBBJoinConfig = (): BBBJoinConfig => {
	return {
		meetingID: 'config.meetingID',
		fullName: 'fullName',
		role: BBBRole.MODERATOR,
		userID: 'userID',
		guest: false,
		redirect: 'redirect',
	};
};

type BBBResponseType = BBBCreateResponse | BBBMeetingInfoResponse | BBBBaseResponse;
const createAxiosResponse = (data: BBBResponse<BBBResponseType>): AxiosResponse<BBBResponse<BBBResponseType>> => {
	return {
		data: data ?? {},
		status: 0,
		statusText: '',
		headers: {},
		config: {},
	};
};

class BBBServiceTest extends BBBService {
	public superToParams(object: BBBCreateConfig | BBBBaseMeetingConfig): URLSearchParams {
		return this.toParams(object);
	}

	public superGetUrl(callName: string, queryParams: URLSearchParams): string {
		return this.getUrl(callName, queryParams);
	}

	public getBaseUrl(): string {
		return super.baseUrl;
	}

	public getSalt(): string {
		return super.salt;
	}

	public superGenerateChecksum(callName: string, queryParams: URLSearchParams): string {
		return this.generateChecksum(callName, queryParams);
	}
}

describe('BBB Service', () => {
	let module: TestingModule;
	let service: BBBServiceTest;
	let httpService: DeepMocked<HttpService>;
	let converterUtil: DeepMocked<ConverterUtil>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BBBServiceTest,
				{
					provide: BbbSettings,
					useValue: createMock<IBbbSettings>({
						host: 'https://bbb.de',
						salt: 'salt12345',
						presentationUrl: '',
					}),
				},
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
		service = module.get(BBBServiceTest);
		httpService = module.get(HttpService);
		converterUtil = module.get(ConverterUtil);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('create', () => {
		let bbbCreateResponse: AxiosResponse<BBBResponse<BBBResponseType>>;
		beforeEach(() => {
			bbbCreateResponse = createAxiosResponse(createBBBCreateResponse());
		});

		it('should return a response with returncode success', async () => {
			// Arrange
			httpService.post.mockReturnValue(of(bbbCreateResponse));
			converterUtil.xml2object.mockReturnValue(bbbCreateResponse.data);

			// Act
			const result = await service.create(createBBBCreateConfig());

			// Assert
			expect(result).toBeDefined();
			expect(httpService.post).toHaveBeenCalledTimes(1);
			expect(converterUtil.xml2object).toHaveBeenCalledWith(bbbCreateResponse.data);
		});

		it('should return a xml configuration with provided presentation url', () => {
			// Arrange
			const presentationUrl = 'https://s3.hidrive.strato.com/cloud-instances/bbb/presentation.pdf';

			// Act
			const result = service.getBbbRequestConfig(presentationUrl);

			// Assert
			expect(result).toBe(
				"<?xml version='1.0' encoding='UTF-8'?><modules><module name='presentation'><document url='https://s3.hidrive.strato.com/cloud-instances/bbb/presentation.pdf' /></module></modules>"
			);
		});

		it('should throw an error if there is a different return code then success', async () => {
			// Arrange
			bbbCreateResponse.data.response.returncode = BBBStatus.ERROR;
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

	describe('end', () => {
		let bbbBaseResponse: AxiosResponse<BBBResponse<BBBBaseResponse>>;
		let bbbBaseMeetingConfig: BBBBaseMeetingConfig;
		beforeEach(() => {
			bbbBaseResponse = createAxiosResponse(createBBBBaseResponse());
			bbbBaseMeetingConfig = { meetingID: 'meetingId' };
		});

		it('should return a response with returncode success', async () => {
			// Arrange
			httpService.get.mockReturnValue(of(bbbBaseResponse));
			converterUtil.xml2object.mockReturnValue(bbbBaseResponse.data);

			// Act
			const result = await service.end(bbbBaseMeetingConfig);

			// Assert
			expect(result).toBeDefined();
			expect(httpService.get).toBeCalled();
			expect(converterUtil.xml2object).toHaveBeenCalledWith(bbbBaseResponse.data);
		});

		it('should throw an error if there is a different return code then success', async () => {
			// Arrange
			bbbBaseResponse.data.response.returncode = BBBStatus.ERROR;
			httpService.get.mockReturnValue(of(bbbBaseResponse));
			converterUtil.xml2object.mockReturnValue(bbbBaseResponse.data);
			const expectedError = new InternalServerErrorException(
				bbbBaseResponse.data.response.messageKey,
				bbbBaseResponse.data.response.message
			);

			// Act && Assert
			await expect(service.end(bbbBaseMeetingConfig)).rejects.toThrowError(expectedError);
		});
	});

	describe('getMeetingInfo', () => {
		let bbbMeetingInfoResponse: AxiosResponse<BBBResponse<BBBResponseType>>;
		let bbbBaseMeetingConfig: BBBBaseMeetingConfig;
		beforeEach(() => {
			bbbMeetingInfoResponse = createAxiosResponse(createBBBMeetingInfoResponse());
			bbbBaseMeetingConfig = { meetingID: 'meetingId' };
		});

		it('should return a response with returncode success', async () => {
			// Arrange
			httpService.get.mockReturnValue(of(bbbMeetingInfoResponse));
			converterUtil.xml2object.mockReturnValue(bbbMeetingInfoResponse.data);

			// Act
			const result = await service.getMeetingInfo(bbbBaseMeetingConfig);

			// Assert
			expect(result).toBeDefined();
			expect(httpService.get).toBeCalled();
			expect(converterUtil.xml2object).toHaveBeenCalledWith(bbbMeetingInfoResponse.data);
		});

		it('should throw an error if there is a different return code then success', async () => {
			// Arrange
			bbbMeetingInfoResponse.data.response.returncode = BBBStatus.ERROR;
			httpService.get.mockReturnValue(of(bbbMeetingInfoResponse));
			converterUtil.xml2object.mockReturnValue(bbbMeetingInfoResponse.data);
			const expectedError = new InternalServerErrorException(
				bbbMeetingInfoResponse.data.response.messageKey,
				bbbMeetingInfoResponse.data.response.message
			);

			// Act && Assert
			await expect(service.getMeetingInfo(bbbBaseMeetingConfig)).rejects.toThrowError(expectedError);
		});
	});

	describe('join', () => {
		let bbbMeetingInfoResponse: AxiosResponse<BBBResponse<BBBResponseType>>;
		let bbbJoinConfig: BBBJoinConfig;
		beforeEach(() => {
			bbbMeetingInfoResponse = createAxiosResponse(createBBBMeetingInfoResponse());
			bbbJoinConfig = createBBBJoinConfig();
		});

		it('should create a join link to a bbb meeting', async () => {
			// Arrange
			httpService.get.mockReturnValue(of(bbbMeetingInfoResponse));
			converterUtil.xml2object.mockReturnValue(bbbMeetingInfoResponse.data);

			// Act
			const url = await service.join(bbbJoinConfig);

			// Assert
			expect(url).toBeDefined();
			expect(httpService.get).toBeCalled();
			expect(converterUtil.xml2object).toHaveBeenCalledWith(bbbMeetingInfoResponse.data);
		});

		it('should throw an error if there is a different return code then success', async () => {
			// Arrange
			bbbMeetingInfoResponse.data.response.returncode = BBBStatus.ERROR;
			httpService.get.mockReturnValue(of(bbbMeetingInfoResponse));
			converterUtil.xml2object.mockReturnValue(bbbMeetingInfoResponse.data);
			const expectedError = new InternalServerErrorException(
				bbbMeetingInfoResponse.data.response.messageKey,
				bbbMeetingInfoResponse.data.response.message
			);

			// Act && Assert
			await expect(service.join(bbbJoinConfig)).rejects.toThrowError(expectedError);
		});

		it('toParams: should return params based on bbb configs', () => {
			// Arrange
			const createConfig: BBBCreateConfig = createBBBCreateConfig();

			// Act
			const params: URLSearchParams = service.superToParams(createConfig);

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
			const hashMock: Hash = {
				update: jest.fn().mockReturnThis(),
				digest: jest.fn().mockReturnValue('encrypt 123'),
			} as unknown as Hash;
			const createHashMock = jest.spyOn(crypto, 'createHash').mockImplementation((): Hash => hashMock);
			const createConfig: BBBCreateConfig = createBBBCreateConfig();
			const callName = 'create';
			const urlSearchParams: URLSearchParams = service.superToParams(createConfig);
			const queryString: string = urlSearchParams.toString();
			const sha = crypto.createHash('sha1');
			const expectedChecksum: string = sha.update(callName + queryString + service.getSalt()).digest('hex');

			// Act
			const checksum: string = service.superGenerateChecksum(callName, urlSearchParams);

			// Assert
			expect(checksum).toEqual(expectedChecksum);
			expect(createHashMock).toBeCalledWith('sha1');
		});

		it('getUrl: should return composed url', () => {
			// Arrange
			const createConfig = createBBBCreateConfig();
			const callName = 'create';
			const params: URLSearchParams = service.superToParams(createConfig);

			// Act
			const url: string = service.superGetUrl(callName, params);

			// Assert
			expect(url.toString()).toContain(`${service.getBaseUrl()}/bigbluebutton/api/${callName}`);
			expect(url.includes('checksum')).toBeTruthy();
		});
	});
});
