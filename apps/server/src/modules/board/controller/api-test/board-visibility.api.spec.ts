import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import { SubmissionItemNode } from '@shared/domain/entity';
import {
	TestApiClient,
	UserAndAccountTestFactory,
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	submissionContainerElementNodeFactory,
	submissionItemNodeFactory,
} from '@shared/testing';
import { SubmissionItemResponse } from '../dto';

const baseRouteName = '/board-submissions';
describe('submission item update (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('when board is visible', () => {
		describe('when user is a valid teacher', () => {
			it('should get the board', async () => {});
			it('should get an element');
		});
		describe('when user is a valid student', () => {
			it('should get the board', async () => {});
			it('should get an element');
		});
	});
});
