import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BoardContextApiHelperService } from '@modules/board-context';
import { LegacySchoolService } from '@modules/legacy-school';
import { UserDo, UserService } from '@modules/user';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VideoConferenceScope } from '../domain';
import { VIDEO_CONFERENCE_CONFIG_TOKEN, VideoConferenceConfig } from '../video-conference-config';
import { ScopeRef } from './dto';
import { VideoConferenceFeatureService } from './video-conference-feature.service';

describe(VideoConferenceFeatureService.name, () => {
	let module: TestingModule;
	let service: VideoConferenceFeatureService;
	let boardContextApiHelperService: DeepMocked<BoardContextApiHelperService>;
	let userService: DeepMocked<UserService>;
	let legacySchoolService: DeepMocked<LegacySchoolService>;
	let config: VideoConferenceConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VideoConferenceFeatureService,
				{
					provide: BoardContextApiHelperService,
					useValue: createMock<BoardContextApiHelperService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
				{
					provide: VIDEO_CONFERENCE_CONFIG_TOKEN,
					useValue: {
						featureVideoConferenceEnabled: false,
					},
				},
			],
		}).compile();

		service = module.get(VideoConferenceFeatureService);
		boardContextApiHelperService = module.get(BoardContextApiHelperService);
		userService = module.get(UserService);
		legacySchoolService = module.get(LegacySchoolService);
		config = module.get(VIDEO_CONFERENCE_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('checkVideoConferenceFeatureEnabled', () => {
		const setup = () => {
			const userId = 'userId';
			const scope: ScopeRef = {
				scope: VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT,
				id: 'id',
			};
			return { userId, scope };
		};

		describe('when scope is video conference element', () => {
			it('should call the board context api helper', async () => {
				const { userId, scope } = setup();

				await service.checkVideoConferenceFeatureEnabled(userId, scope);

				expect(boardContextApiHelperService.getFeaturesForBoardNode).toBeCalledWith(scope.id);
			});

			describe('when video conference feature is not enabled', () => {
				it('should throw a forbidden exception', async () => {
					const { userId, scope } = setup();

					boardContextApiHelperService.getFeaturesForBoardNode.mockResolvedValueOnce([]);

					await expect(service.checkVideoConferenceFeatureEnabled(userId, scope)).rejects.toThrow(ForbiddenException);
				});
			});
		});
	});

	describe('when scope is course', () => {
		const setup = () => {
			userService.findById.mockResolvedValueOnce({ schoolId: 'schoolId' } as UserDo);
			const userId = 'userId';
			const scope: ScopeRef = {
				scope: VideoConferenceScope.COURSE,
				id: 'id',
			};

			return { userId, scope };
		};

		describe('when video conference is not enabled for school', () => {
			it('should throw a forbidden exception', async () => {
				const { userId, scope } = setup();

				legacySchoolService.hasFeature.mockResolvedValueOnce(false);

				await expect(service.checkVideoConferenceFeatureEnabled(userId, scope)).rejects.toThrow(ForbiddenException);
			});
		});

		describe('when video conference is not enabled for config', () => {
			it('should throw a forbidden exception', async () => {
				const { userId, scope } = setup();

				legacySchoolService.hasFeature.mockResolvedValueOnce(true);
				config.featureVideoConferenceEnabled = false;

				await expect(service.checkVideoConferenceFeatureEnabled(userId, scope)).rejects.toThrow(ForbiddenException);
			});
		});

		describe('when video conference is enabled for school + config', () => {
			it('should resolve', async () => {
				const { userId, scope } = setup();

				legacySchoolService.hasFeature.mockResolvedValueOnce(true);
				config.featureVideoConferenceEnabled = true;

				await expect(service.checkVideoConferenceFeatureEnabled(userId, scope)).resolves.toBeUndefined();
			});
		});
	});
});
