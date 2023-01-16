import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { CardElement, CompletionDateCardElement, RichTextCardElement, TitleCardElement } from '@shared/domain';
import { cleanupCollections } from '@shared/testing';

import { MongoMemoryDatabaseModule } from '@shared/infra/database';

import {
	CardElementRepo,
	CompletionDateCardElementRepo,
	RichTextCardElementRepo,
	TitleCardElementRepo,
} from './card-element.repo';

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

describe('TitleCardElementRepo', () => {
	let module: TestingModule;
	let repo: TitleCardElementRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [TitleCardElementRepo],
		}).compile();
		repo = module.get(TitleCardElementRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		await em.nativeDelete(TitleCardElement, {});
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(TitleCardElement);
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

describe('CompletionDateCardElementRepo', () => {
	let module: TestingModule;
	let repo: CompletionDateCardElementRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [CompletionDateCardElementRepo],
		}).compile();
		repo = module.get(CompletionDateCardElementRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		await em.nativeDelete(CompletionDateCardElement, {});
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(CompletionDateCardElement);
	});
});
