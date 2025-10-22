import { LegacyLogger } from '@core/logger';
import { createMock } from '@golevelup/ts-jest';
import { EntityData, NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { VideoConferenceDO, VideoConferenceOptionsDO, VideoConferenceScope } from '../domain';
import { videoConferenceFactory } from '../testing';
import { VideoConferenceOptions } from './video-conference-options.embeddable';
import { VideoConferenceTargetModels } from './video-conference-target-models.enum';
import { VideoConferenceEntity } from './video-conference.entity';
import { VideoConferenceRepo } from './video-conference.repo';

class VideoConferenceRepoSpec extends VideoConferenceRepo {
	mapEntityToDOSpec(entity: VideoConferenceEntity): VideoConferenceDO {
		return super.mapEntityToDO(entity);
	}

	mapDOToEntityPropertiesSpec(entityDO: VideoConferenceDO): EntityData<VideoConferenceEntity> {
		return super.mapDOToEntityProperties(entityDO);
	}
}

describe('Video Conference Repo', () => {
	let module: TestingModule;
	let repo: VideoConferenceRepoSpec;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [VideoConferenceEntity] })],
			providers: [
				VideoConferenceRepoSpec,
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();
		repo = module.get(VideoConferenceRepoSpec);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.findById).toEqual('function');
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(VideoConferenceEntity);
	});

	describe('findByScopeId', () => {
		const setup = async () => {
			const vcA = videoConferenceFactory.build();
			await em.persistAndFlush(vcA);

			return {
				vcA,
			};
		};

		it('should find a videoconference by ScopeId', async () => {
			const { vcA } = await setup();

			const result = await repo.findByScopeAndScopeId(vcA.target, VideoConferenceScope.COURSE);

			expect(result.id).toEqual(vcA.id);
		});

		it('should throw an Error if the scope mismatches the idtype', async () => {
			await setup();

			const func = () => repo.findByScopeAndScopeId(new ObjectId().toHexString(), VideoConferenceScope.EVENT);

			await expect(func()).rejects.toThrow(NotFoundError);
		});
	});

	describe('mapEntityToDO', () => {
		it('should return a domain object', () => {
			// Arrange
			const id = new ObjectId();
			const testEntity: VideoConferenceEntity = {
				id: id.toHexString(),
				_id: id,
				updatedAt: new Date('2022-07-20'),
				createdAt: new Date('2022-07-20'),
				salt: 'fixed-salt-for-testing',
				options: new VideoConferenceOptions({
					everybodyJoinsAsModerator: true,
					everyAttendeJoinsMuted: true,
					moderatorMustApproveJoinRequests: false,
				}),
				targetModel: VideoConferenceTargetModels.COURSES,
				target: new ObjectId().toHexString(),
			};

			// Act
			const videoConferenceDO: VideoConferenceDO = repo.mapEntityToDOSpec(testEntity);

			// Assert
			expect(videoConferenceDO.id).toEqual(testEntity.id);
			expect(videoConferenceDO.target).toEqual(testEntity.target);
			expect(videoConferenceDO.targetModel).toEqual(VideoConferenceScope.COURSE);
			const { options } = videoConferenceDO;
			expect(options.everybodyJoinsAsModerator).toEqual(testEntity.options.everybodyJoinsAsModerator);
			expect(options.everyAttendeeJoinsMuted).toEqual(testEntity.options.everyAttendeJoinsMuted);
			expect(options.moderatorMustApproveJoinRequests).toEqual(testEntity.options.moderatorMustApproveJoinRequests);
		});
	});

	describe('mapDOToEntityProperties', () => {
		it('should map DO to Entity Properties', () => {
			// Arrange
			const testDO: VideoConferenceDO = new VideoConferenceDO({
				id: 'testId',
				target: new ObjectId().toHexString(),
				targetModel: VideoConferenceScope.COURSE,
				salt: 'fixed-salt-for-testing',
				options: new VideoConferenceOptionsDO({
					everybodyJoinsAsModerator: true,
					everyAttendeeJoinsMuted: true,
					moderatorMustApproveJoinRequests: false,
				}),
			});

			// Act
			const result: EntityData<VideoConferenceEntity> = repo.mapDOToEntityPropertiesSpec(testDO);

			// Assert
			expect(result.target).toEqual(testDO.target);
			expect(result.targetModel).toEqual(VideoConferenceTargetModels.COURSES);
			expect(result.options?.everyAttendeJoinsMuted).toEqual(testDO.options.everyAttendeeJoinsMuted);
			expect(result.options?.everybodyJoinsAsModerator).toEqual(testDO.options.everybodyJoinsAsModerator);
			expect(result.options?.moderatorMustApproveJoinRequests).toEqual(testDO.options.moderatorMustApproveJoinRequests);
		});
	});
});
