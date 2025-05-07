import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { UserService } from '@modules/user';
import { userDoFactory } from '@modules/user/testing';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BBBBaseResponse, BBBResponse, BBBRole, BBBStatus } from '../bbb';
import { VideoConferenceScope } from '../domain';
import { ErrorStatus } from '../error';
import { BBBService, VideoConferenceService } from '../service';
import { ScopeInfo, VideoConferenceState } from './dto';
import { VideoConferenceEndUc } from './video-conference-end.uc';
import { VideoConferenceFeatureService } from './video-conference-feature.service';

describe('VideoConferenceEndUc', () => {
	let module: TestingModule;
	let uc: VideoConferenceEndUc;
	let bbbService: DeepMocked<BBBService>;
	let userService: DeepMocked<UserService>;
	let videoConferenceService: DeepMocked<VideoConferenceService>;
	let videoConferenceFeatureService: DeepMocked<VideoConferenceFeatureService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VideoConferenceEndUc,
				{
					provide: BBBService,
					useValue: createMock<BBBService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: VideoConferenceService,
					useValue: createMock<VideoConferenceService>(),
				},
				{
					provide: VideoConferenceFeatureService,
					useValue: createMock<VideoConferenceFeatureService>(),
				},
			],
		}).compile();

		uc = module.get<VideoConferenceEndUc>(VideoConferenceEndUc);
		bbbService = module.get(BBBService);
		userService = module.get(UserService);
		videoConferenceService = module.get(VideoConferenceService);
		videoConferenceFeatureService = module.get(VideoConferenceFeatureService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('end', () => {
		describe('when user is not moderator', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();
				const currentUserId = user.id as string;
				const scope = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };
				const scopeInfo: ScopeInfo = {
					scopeId: scope.id,
					scopeName: VideoConferenceScope.COURSE,
					title: 'title',
					logoutUrl: 'logoutUrl',
				};

				const bbbEndResponse: BBBResponse<BBBBaseResponse> = {
					response: {
						returncode: BBBStatus.SUCCESS,
					} as BBBBaseResponse,
				};

				userService.findById.mockResolvedValue(user);
				videoConferenceFeatureService.checkVideoConferenceFeatureEnabled.mockResolvedValue();
				videoConferenceService.getScopeInfo.mockResolvedValue(scopeInfo);
				bbbService.end.mockResolvedValue(bbbEndResponse);
				videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.VIEWER);

				return { user, currentUserId, scope, bbbEndResponse, scopeInfo };
			};

			it('should throw ForbiddenException', async () => {
				const { currentUserId, scope } = setup();

				const func = () => uc.end(currentUserId, scope);

				await expect(func).rejects.toThrow(new ForbiddenException(ErrorStatus.INSUFFICIENT_PERMISSION));
			});
		});

		describe('when user is moderator', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();
				const currentUserId: string = user.id as string;
				const scope = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };
				const scopeInfo: ScopeInfo = {
					scopeId: scope.id,
					scopeName: VideoConferenceScope.COURSE,
					title: 'title',
					logoutUrl: 'logoutUrl',
				};

				const bbbEndResponse: BBBResponse<BBBBaseResponse> = {
					response: {
						returncode: BBBStatus.SUCCESS,
					} as BBBBaseResponse,
				};

				userService.findById.mockResolvedValue(user);
				videoConferenceFeatureService.checkVideoConferenceFeatureEnabled.mockResolvedValue();
				videoConferenceService.getScopeInfo.mockResolvedValue(scopeInfo);
				bbbService.end.mockResolvedValue(bbbEndResponse);
				videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.MODERATOR);

				return { currentUserId, scope, bbbEndResponse };
			};

			it('should call feature check service', async () => {
				const { currentUserId, scope } = setup();

				await uc.end(currentUserId, scope);

				expect(videoConferenceFeatureService.checkVideoConferenceFeatureEnabled).toBeCalledWith(currentUserId, scope);
			});

			it('should call videoConferenceService.getScopeInfo', async () => {
				const { currentUserId, scope } = setup();

				await uc.end(currentUserId, scope);

				expect(videoConferenceService.getScopeInfo).toBeCalledWith(currentUserId, scope.id, scope.scope);
			});

			it('should call bbbService.end', async () => {
				const { currentUserId, scope } = setup();

				await uc.end(currentUserId, scope);

				expect(bbbService.end).toBeCalledWith({ meetingID: scope.id });
			});

			it('should call videoConferenceService.determineBbbRole', async () => {
				const { currentUserId, scope } = setup();

				await uc.end(currentUserId, scope);

				expect(videoConferenceService.determineBbbRole).toBeCalledWith(currentUserId, scope.id, scope.scope);
			});

			it('should end a video conference', async () => {
				const { currentUserId, scope, bbbEndResponse } = setup();

				const result = await uc.end(currentUserId, scope);

				expect(result.state).toBe(VideoConferenceState.FINISHED);
				expect(result.bbbResponse).toBe(bbbEndResponse);
			});
		});

		describe('feature check', () => {
			const setup = (scopeName: VideoConferenceScope) => {
				const user = userDoFactory.buildWithId();
				const currentUserId: string = user.id as string;
				const scope = { scope: scopeName, id: new ObjectId().toHexString() };
				const scopeInfo: ScopeInfo = {
					scopeId: scope.id,
					scopeName,
					title: 'title',
					logoutUrl: 'logoutUrl',
				};

				const bbbEndResponse = {
					response: {
						returncode: BBBStatus.SUCCESS,
					} as BBBBaseResponse,
				};

				userService.findById.mockResolvedValue(user);
				videoConferenceFeatureService.checkVideoConferenceFeatureEnabled.mockResolvedValue();
				videoConferenceService.getScopeInfo.mockResolvedValue(scopeInfo);
				bbbService.end.mockResolvedValue(bbbEndResponse);
				videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.MODERATOR);

				return { user, currentUserId, scope };
			};

			it('should call the feature check service', async () => {
				const { currentUserId, scope } = setup(VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT);

				videoConferenceFeatureService.checkVideoConferenceFeatureEnabled.mockResolvedValue();

				await uc.end(currentUserId, scope);

				expect(videoConferenceFeatureService.checkVideoConferenceFeatureEnabled).toBeCalledWith(currentUserId, scope);
			});
		});
	});
});
