import { createMock } from '@golevelup/ts-jest';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { VideoConferenceDO, VideoConferenceOptionsDO } from '@shared/domain/domainobject';
import {
	IVideoConferenceProperties,
	TargetModels,
	VideoConference,
	VideoConferenceOptions,
} from '@shared/domain/entity';
import { VideoConferenceScope } from '@shared/domain/interface';
import { VideoConferenceRepo } from '@shared/repo';
import { cleanupCollections } from '@shared/testing';
import { videoConferenceFactory } from '@shared/testing/factory/video-conference.factory';
import { LegacyLogger } from '@src/core/logger';

class VideoConferenceRepoSpec extends VideoConferenceRepo {
	mapEntityToDOSpec(entity: VideoConference): VideoConferenceDO {
		return super.mapEntityToDO(entity);
	}

	mapDOToEntityPropertiesSpec(entityDO: VideoConferenceDO): IVideoConferenceProperties {
		return super.mapDOToEntityProperties(entityDO);
	}
}

describe('Video Conference Repo', () => {
	let module: TestingModule;
	let repo: VideoConferenceRepoSpec;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
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
		expect(repo.entityName).toBe(VideoConference);
	});

	describe('entityFactory', () => {
		const props: IVideoConferenceProperties = {
			target: 'teams',
			targetModel: TargetModels.EVENTS,
			options: new VideoConferenceOptions({
				everybodyJoinsAsModerator: false,
				everyAttendeJoinsMuted: false,
				moderatorMustApproveJoinRequests: false,
			}),
		};

		it('should return new entity of type VideoConference', () => {
			const result: VideoConference = repo.entityFactory(props);

			expect(result).toBeInstanceOf(VideoConference);
		});

		it('should return new entity with values from properties', () => {
			const result: VideoConference = repo.entityFactory(props);

			expect(result).toEqual(expect.objectContaining(props));
		});
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
			const testEntity: VideoConference = {
				id: id.toHexString(),
				_id: id,
				updatedAt: new Date('2022-07-20'),
				createdAt: new Date('2022-07-20'),
				options: new VideoConferenceOptions({
					everybodyJoinsAsModerator: true,
					everyAttendeJoinsMuted: true,
					moderatorMustApproveJoinRequests: false,
				}),
				targetModel: TargetModels.COURSES,
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
				options: new VideoConferenceOptionsDO({
					everybodyJoinsAsModerator: true,
					everyAttendeeJoinsMuted: true,
					moderatorMustApproveJoinRequests: false,
				}),
			});

			// Act
			const result: IVideoConferenceProperties = repo.mapDOToEntityPropertiesSpec(testDO);

			// Assert
			expect(result.target).toEqual(testDO.target);
			expect(result.targetModel).toEqual(TargetModels.COURSES);
			expect(result.options.everyAttendeJoinsMuted).toEqual(testDO.options.everyAttendeeJoinsMuted);
			expect(result.options.everybodyJoinsAsModerator).toEqual(testDO.options.everybodyJoinsAsModerator);
			expect(result.options.moderatorMustApproveJoinRequests).toEqual(testDO.options.moderatorMustApproveJoinRequests);
		});
	});
});
