import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { CardElement, RichTextCardElement } from '@shared/domain';
import { cleanupCollections } from '@shared/testing';

import { MongoMemoryDatabaseModule } from '@shared/infra/database';

import { CardElementRepo, RichTextCardElementRepo } from './card-element.repo';

describe('CardElementRepo', () => {
	let module: TestingModule;
	let repo: CardElementRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [CardElementRepo],
		}).compile();
		repo = module.get(CardElementRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		await em.nativeDelete(CardElement, {});
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(CardElement);
	});
});

describe('RichTextCardElementRepo', () => {
	let module: TestingModule;
	let repo: RichTextCardElementRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [RichTextCardElementRepo],
		}).compile();
		repo = module.get(RichTextCardElementRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		await em.nativeDelete(RichTextCardElement, {});
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(RichTextCardElement);
	});
});
