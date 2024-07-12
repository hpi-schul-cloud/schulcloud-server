import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@shared/testing';
import { ErrorUtils } from '@src/core/error/utils';
import { AxiosResponse } from 'axios';
import crypto, { Hash } from 'crypto';
import { of } from 'rxjs';
import { URLSearchParams } from 'url';
import { BbbSettings, IBbbSettings } from './bbb-settings.interface';
import { BBBService } from './bbb.service';
import { BBBBaseMeetingConfig, BBBCreateConfig, BBBJoinConfig, BBBRole, GuestPolicy } from './request';
import { BBBBaseResponse, BBBCreateResponse, BBBMeetingInfoResponse, BBBResponse, BBBStatus } from './response';

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
const createAxiosResponse = (data: BBBResponse<BBBResponseType>) =>
	axiosResponseFactory.build({
		data,
	});

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
			],
		}).compile();
		service = module.get(BBBServiceTest);
		httpService = module.get(HttpService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('create', () => {
		describe('when valid parameter passed and the BBB response well', () => {
			const setup = () => {
				const bbbCreateResponse: AxiosResponse<BBBResponse<BBBResponseType>> = createAxiosResponse(
					createBBBCreateResponse()
				);

				const param = createBBBCreateConfig();

				httpService.post.mockReturnValueOnce(of(bbbCreateResponse));
				const spy = jest.spyOn(service, 'xml2object').mockReturnValueOnce(bbbCreateResponse.data);

				return { param, bbbCreateResponse, spy };
			};

			it('should return a response with returncode success', async () => {
				const { bbbCreateResponse, param, spy } = setup();

				const result = await service.create(param);

				expect(result).toBeDefined();
				expect(httpService.post).toHaveBeenCalledTimes(1);
				expect(spy).toHaveBeenCalledWith(bbbCreateResponse.data);
			});
		});

		describe('when valid parameter passed and the BBB response with error', () => {
			const setup = () => {
				const bbbCreateResponse: AxiosResponse<BBBResponse<BBBResponseType>> = createAxiosResponse(
					createBBBCreateResponse()
				);
				bbbCreateResponse.data.response.returncode = BBBStatus.ERROR;

				const param = createBBBCreateConfig();

				httpService.post.mockReturnValueOnce(of(bbbCreateResponse));
				jest.spyOn(service, 'xml2object').mockReturnValueOnce(bbbCreateResponse.data);

				const error = new InternalServerErrorException(
					`${bbbCreateResponse.data.response.messageKey}, ${bbbCreateResponse.data.response.message}`
				);
				const expectedError = new InternalServerErrorException(
					null,
					ErrorUtils.createHttpExceptionOptions(error, 'BBBService:create')
				);

				return { param, expectedError };
			};

			it('should throw an error', async () => {
				const { expectedError, param } = setup();

				await expect(service.create(param)).rejects.toThrowError(expectedError);
			});
		});
	});

	describe('end', () => {
		describe('when valid parameter passed and the BBB response well', () => {
			const setup = () => {
				const bbbBaseResponse: AxiosResponse<BBBResponse<BBBBaseResponse>> = createAxiosResponse(
					createBBBBaseResponse()
				);
				const bbbBaseMeetingConfig: BBBBaseMeetingConfig = { meetingID: 'meetingId' };

				httpService.get.mockReturnValueOnce(of(bbbBaseResponse));
				const spy = jest.spyOn(service, 'xml2object').mockReturnValueOnce(bbbBaseResponse.data);

				return { bbbBaseResponse, bbbBaseMeetingConfig, spy };
			};

			it('should return a response with returncode success', async () => {
				const { bbbBaseResponse, bbbBaseMeetingConfig, spy } = setup();

				const result = await service.end(bbbBaseMeetingConfig);

				expect(result).toBeDefined();
				expect(httpService.get).toBeCalled();
				expect(spy).toHaveBeenCalledWith(bbbBaseResponse.data);
			});
		});

		describe('when valid parameter passed and the BBB response with error', () => {
			const setup = () => {
				const bbbBaseResponse: AxiosResponse<BBBResponse<BBBBaseResponse>> = createAxiosResponse(
					createBBBBaseResponse()
				);
				bbbBaseResponse.data.response.returncode = BBBStatus.ERROR;
				const param: BBBBaseMeetingConfig = { meetingID: 'meetingId' };

				httpService.get.mockReturnValueOnce(of(bbbBaseResponse));
				jest.spyOn(service, 'xml2object').mockReturnValueOnce(bbbBaseResponse.data);

				const error = new InternalServerErrorException(
					`${bbbBaseResponse.data.response.messageKey}, ${bbbBaseResponse.data.response.message}`
				);
				const expectedError = new InternalServerErrorException(
					null,
					ErrorUtils.createHttpExceptionOptions(error, 'BBBService:end')
				);

				return { expectedError, param };
			};

			it('should throw an error if there is a different return code then success', async () => {
				const { param, expectedError } = setup();

				await expect(service.end(param)).rejects.toThrowError(expectedError);
			});
		});
	});

	describe('getMeetingInfo', () => {
		describe('when valid parameter passed and the BBB response well', () => {
			const setup = () => {
				const bbbMeetingInfoResponse: AxiosResponse<BBBResponse<BBBResponseType>> = createAxiosResponse(
					createBBBMeetingInfoResponse()
				);
				const param: BBBBaseMeetingConfig = { meetingID: 'meetingId' };

				httpService.get.mockReturnValueOnce(of(bbbMeetingInfoResponse));
				const spy = jest.spyOn(service, 'xml2object').mockReturnValueOnce(bbbMeetingInfoResponse.data);

				return { bbbMeetingInfoResponse, param, spy };
			};

			it('should return a response with returncode success', async () => {
				const { bbbMeetingInfoResponse, param, spy } = setup();
				const result = await service.getMeetingInfo(param);

				expect(result).toBeDefined();
				expect(httpService.get).toBeCalled();
				expect(spy).toHaveBeenCalledWith(bbbMeetingInfoResponse.data);
			});
		});

		describe('when valid parameter passed and the BBB response with error', () => {
			const setup = () => {
				const bbbMeetingInfoResponse: AxiosResponse<BBBResponse<BBBResponseType>> = createAxiosResponse(
					createBBBMeetingInfoResponse()
				);
				bbbMeetingInfoResponse.data.response.returncode = BBBStatus.ERROR;
				const param: BBBBaseMeetingConfig = { meetingID: 'meetingId' };

				httpService.get.mockReturnValueOnce(of(bbbMeetingInfoResponse));
				jest.spyOn(service, 'xml2object').mockReturnValueOnce(bbbMeetingInfoResponse.data);

				const error = new InternalServerErrorException(
					`${bbbMeetingInfoResponse.data.response.messageKey}: ${bbbMeetingInfoResponse.data.response.message}`
				);
				const expectedError = new InternalServerErrorException(
					null,
					ErrorUtils.createHttpExceptionOptions(error, 'BBBService:getMeetingInfo')
				);

				return { expectedError, param };
			};

			it('should throw an error if there is a different return code then success', async () => {
				const { expectedError, param } = setup();

				await expect(service.getMeetingInfo(param)).rejects.toThrowError(expectedError);
			});
		});
	});

	describe('join', () => {
		describe('when valid parameter passed and the BBB response well', () => {
			const setup = () => {
				const bbbMeetingInfoResponse: AxiosResponse<BBBResponse<BBBResponseType>> = createAxiosResponse(
					createBBBMeetingInfoResponse()
				);
				const param: BBBJoinConfig = createBBBJoinConfig();

				httpService.get.mockReturnValueOnce(of(bbbMeetingInfoResponse));
				const spy = jest.spyOn(service, 'xml2object').mockReturnValueOnce(bbbMeetingInfoResponse.data);

				return { param, bbbMeetingInfoResponse, spy };
			};

			it('should create a join link to a bbb meeting', async () => {
				const { param, bbbMeetingInfoResponse, spy } = setup();

				const url = await service.join(param);

				expect(url).toBeDefined();
				expect(httpService.get).toBeCalled();
				expect(spy).toHaveBeenCalledWith(bbbMeetingInfoResponse.data);
			});
		});

		describe('when valid parameter passed and the BBB response with error', () => {
			const setup = () => {
				const bbbMeetingInfoResponse: AxiosResponse<BBBResponse<BBBResponseType>> = createAxiosResponse(
					createBBBMeetingInfoResponse()
				);
				bbbMeetingInfoResponse.data.response.returncode = BBBStatus.ERROR;
				const param: BBBJoinConfig = createBBBJoinConfig();

				httpService.get.mockReturnValueOnce(of(bbbMeetingInfoResponse));
				jest.spyOn(service, 'xml2object').mockReturnValueOnce(bbbMeetingInfoResponse.data);

				const error = new InternalServerErrorException(
					`${bbbMeetingInfoResponse.data.response.messageKey}: ${bbbMeetingInfoResponse.data.response.message}`
				);
				const expectedError = new InternalServerErrorException(
					null,
					ErrorUtils.createHttpExceptionOptions(error, 'BBBService:getMeetingInfo')
				);

				return { param, expectedError };
			};

			it('should throw an error if there is a different return code then success', async () => {
				const { param, expectedError } = setup();

				await expect(service.join(param)).rejects.toThrowError(expectedError);
			});
		});

		it('toParams: should return params based on bbb configs', () => {
			const createConfig = createBBBCreateConfig();

			const params = service.superToParams(createConfig);

			expect(params.get('name')).toEqual(createConfig.name);
			expect(params.get('meetingID')).toEqual(createConfig.meetingID);
			expect(params.get('logoutURL')).toEqual(createConfig.logoutURL);
			expect(params.get('welcome')).toEqual(createConfig.welcome);
			expect(params.get('guestPolicy')).toEqual(createConfig.guestPolicy?.toString());
			expect(params.get('moderatorPW')).toEqual(createConfig.moderatorPW);
			expect(params.get('attendeePW')).toEqual(createConfig.attendeePW);
			expect(params.get('allowModsToUnmuteUsers')).toEqual(String(createConfig.allowModsToUnmuteUsers));
		});

		const setup = () => {
			const hashMock: Hash = {
				update: jest.fn().mockReturnThis(),
				digest: jest.fn().mockReturnValueOnce('encrypt 123').mockReturnValueOnce('encrypt 123'),
			} as unknown as Hash;
			const createHashMock = jest.spyOn(crypto, 'createHash').mockImplementation((): Hash => hashMock);
			const createConfig = createBBBCreateConfig();
			const callName = 'create';

			return {
				callName,
				createConfig,
				createHashMock,
			};
		};

		it('generateChecksum: should generate a checksum for queryParams', () => {
			const { callName, createConfig, createHashMock } = setup();
			const urlSearchParams = service.superToParams(createConfig);
			const queryString = urlSearchParams.toString();
			const sha = crypto.createHash('sha1');
			const expectedChecksum = sha.update(callName + queryString + service.getSalt()).digest('hex');

			const checksum = service.superGenerateChecksum(callName, urlSearchParams);

			expect(checksum).toEqual(expectedChecksum);
			expect(createHashMock).toBeCalledWith('sha1');
		});

		it('getUrl: should return composed url', () => {
			const { callName, createConfig } = setup();
			const params = service.superToParams(createConfig);

			const url = service.superGetUrl(callName, params);

			expect(url.toString()).toContain(`${service.getBaseUrl()}/bigbluebutton/api/${callName}`);
			expect(url.includes('checksum')).toBeTruthy();
		});
	});
});
