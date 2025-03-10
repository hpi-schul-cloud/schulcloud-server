import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BoardContextApiHelperService } from '@modules/board-context';
import { LegacySchoolService } from '@modules/legacy-school';
import { UserDo, UserService } from '@modules/user';
import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { VideoConferenceScope } from '../domain';
import { VideoConferenceConfig } from '../video-conference-config';
import { ScopeRef } from './dto';
import { VideoConferenceFeatureService } from './video-conference-feature.service';

describe(VideoConferenceFeatureService.name, () => {
	let module: TestingModule;
	let service: VideoConferenceFeatureService;
	let boardContextApiHelperService: DeepMocked<BoardContextApiHelperService>;
	let userService: DeepMocked<UserService>;
	let legacySchoolService: DeepMocked<LegacySchoolService>;

	const config: VideoConferenceConfig = {
		HOST: 'https://bbb.example.com/bigbluebutton/',
		FEATURE_VIDEOCONFERENCE_ENABLED: false,
	};

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
					provide: ConfigService,
					useValue: {
						get: jest.fn().mockImplementation((key: keyof VideoConferenceConfig) => config[key]),
					},
				},
			],
		}).compile();

		service = module.get(VideoConferenceFeatureService);
		boardContextApiHelperService = module.get(BoardContextApiHelperService);
		userService = module.get(UserService);
		legacySchoolService = module.get(LegacySchoolService);
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
				config.FEATURE_VIDEOCONFERENCE_ENABLED = false;

				await expect(service.checkVideoConferenceFeatureEnabled(userId, scope)).rejects.toThrow(ForbiddenException);
			});
		});

		describe('when video conference is enabled for school + config', () => {
			it('should resolve', async () => {
				const { userId, scope } = setup();

				legacySchoolService.hasFeature.mockResolvedValueOnce(true);
				config.FEATURE_VIDEOCONFERENCE_ENABLED = true;

				await expect(service.checkVideoConferenceFeatureEnabled(userId, scope)).rejects.toThrow(ForbiddenException);
			});
		});
	});
});
