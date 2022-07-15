import { VideoConferenceRepo } from '@shared/repo';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections } from '@shared/testing';
import { VideoConference } from '@shared/domain';
import { videoConferenceFactory } from '@shared/testing/factory/video-conference.factory';
import { NotFoundError } from '@mikro-orm/core';
import { VideoConferenceScope } from '@shared/domain/interface/vc-scope.enum';

describe('Video Conference Repo', () => {
	let module: TestingModule;
	let repo: VideoConferenceRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [VideoConferenceRepo],
		}).compile();
		repo = module.get(VideoConferenceRepo);
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

	describe('findById', () => {
		it('should return right keys', async () => {
			const vc = videoConferenceFactory.build();

			await em.persistAndFlush([vc]);
			const result = await repo.findById(vc.id);
			expect(result.target).toEqual(vc.target);
		});

		it('should return one videoconference that matched by id', async () => {
			const vcA = videoConferenceFactory.build();
			const vcB = videoConferenceFactory.build();

			await em.persistAndFlush([vcA, vcB]);
			const result = await repo.findById(vcA.id);
			expect(result.id).toEqual(vcA.id);
		});

		it('should throw an error if vc by id doesnt exist', async () => {
			const idA = new ObjectId().toHexString();

			await expect(repo.findById(idA)).rejects.toThrow(NotFoundError);
		});
	});

	describe('findByScopeId', () => {
		it('should find a vc by ScopeId', async () => {
			const vcA = videoConferenceFactory.build();
			await em.persistAndFlush(vcA);
			const result = await repo.findByScopeId(vcA.target, VideoConferenceScope.COURSE);
			expect(result.id).toEqual(vcA.id);
		});

		it('should throw an Error if the scope mismatches the idtype', async () => {
			const vcA = videoConferenceFactory.build();
			await expect(repo.findByScopeId(vcA.target, VideoConferenceScope.EVENT)).rejects.toThrow(NotFoundError);
		});
	});
});
