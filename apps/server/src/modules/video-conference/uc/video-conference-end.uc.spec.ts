import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UserService } from '@modules/user';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDO } from '@shared/domain/domainobject';
import {} from '@shared/domain/entity';
import { VideoConferenceScope } from '@shared/domain/interface';
import { userDoFactory } from '@shared/testing/factory';
import { ObjectId } from '@mikro-orm/mongodb';
import { BBBBaseResponse, BBBResponse, BBBRole, BBBStatus } from '../bbb';
import { ErrorStatus } from '../error/error-status.enum';
import { BBBService, VideoConferenceService } from '../service';
import { ScopeInfo, VideoConference, VideoConferenceState } from './dto';
import { VideoConferenceEndUc } from './video-conference-end.uc';

describe('VideoConferenceEndUc', () => {
	let module: TestingModule;
	let uc: VideoConferenceEndUc;
	let bbbService: DeepMocked<BBBService>;
	let userService: DeepMocked<UserService>;
	let videoConferenceService: DeepMocked<VideoConferenceService>;

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
			],
		}).compile();

		uc = module.get<VideoConferenceEndUc>(VideoConferenceEndUc);
		bbbService = module.get(BBBService);
		userService = module.get(UserService);
		videoConferenceService = module.get(VideoConferenceService);
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
				const user: UserDO = userDoFactory.buildWithId();
				const currentUserId: string = user.id as string;
				const scope = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };
				const scopeInfo: ScopeInfo = {
					scopeId: scope.id,
					scopeName: 'scopeName',
					title: 'title',
					logoutUrl: 'logoutUrl',
				};

				const bbbEndResponse: BBBResponse<BBBBaseResponse> = {
					response: {
						returncode: BBBStatus.SUCCESS,
					} as BBBBaseResponse,
				};

				userService.findById.mockResolvedValue(user);
				videoConferenceService.throwOnFeaturesDisabled.mockResolvedValue();
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
				const user: UserDO = userDoFactory.buildWithId();
				const currentUserId: string = user.id as string;
				const scope = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };
				const scopeInfo: ScopeInfo = {
					scopeId: scope.id,
					scopeName: 'scopeName',
					title: 'title',
					logoutUrl: 'logoutUrl',
				};

				const bbbEndResponse: BBBResponse<BBBBaseResponse> = {
					response: {
						returncode: BBBStatus.SUCCESS,
					} as BBBBaseResponse,
				};

				userService.findById.mockResolvedValue(user);
				videoConferenceService.throwOnFeaturesDisabled.mockResolvedValue();
				videoConferenceService.getScopeInfo.mockResolvedValue(scopeInfo);
				bbbService.end.mockResolvedValue(bbbEndResponse);
				videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.MODERATOR);

				return { currentUserId, scope, bbbEndResponse };
			};

			it('should call userService.findById', async () => {
				const { currentUserId, scope } = setup();

				await uc.end(currentUserId, scope);

				expect(userService.findById).toBeCalledWith(currentUserId);
			});

			it('should call videoConferenceService.throwOnFeaturesDisabled', async () => {
				const { currentUserId, scope } = setup();

				await uc.end(currentUserId, scope);

				expect(videoConferenceService.throwOnFeaturesDisabled).toBeCalled();
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

				const result: VideoConference<BBBBaseResponse> = await uc.end(currentUserId, scope);

				expect(result.state).toBe(VideoConferenceState.FINISHED);
				expect(result.bbbResponse).toBe(bbbEndResponse);
			});
		});
	});
});
