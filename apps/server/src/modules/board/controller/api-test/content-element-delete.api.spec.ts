import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { TldrawClientAdapter } from '@infra/tldraw-client';
import { EntityManager } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { ServerTestModule } from '@modules/server/server.app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { BoardExternalReferenceType } from '../../domain';
import { BoardNodeEntity } from '../../repo';
import {
	cardEntityFactory,
	columnBoardEntityFactory,
	columnEntityFactory,
	drawingElementEntityFactory,
	richTextElementEntityFactory,
} from '../../testing';

const baseRouteName = '/elements';

describe(`content element delete (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let filesStorageClientAdapterService: DeepMocked<FilesStorageClientAdapterService>;
	let drawingElementAdapterService: DeepMocked<TldrawClientAdapter>;
	let apiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideProvider(FilesStorageClientAdapterService)
			.useValue(createMock<FilesStorageClientAdapterService>())
			.overrideProvider(TldrawClientAdapter)
			.useValue(createMock<TldrawClientAdapter>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		filesStorageClientAdapterService = module.get(FilesStorageClientAdapterService);
		drawingElementAdapterService = module.get(TldrawClientAdapter);
		apiClient = new TestApiClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('with authorized user', () => {
		const setup = async () => {
			await cleanupCollections(em);
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseEntityFactory.build({ teachers: [teacherUser] });
			await em.persistAndFlush([teacherAccount, teacherUser, course]);

			const columnBoardNode = columnBoardEntityFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});
			const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
			const cardNode = cardEntityFactory.withParent(columnNode).build();
			const element = richTextElementEntityFactory.withParent(cardNode).build();
			const sibling = richTextElementEntityFactory.withParent(cardNode).build();

			await em.persistAndFlush([columnBoardNode, columnNode, cardNode, element, sibling]);
			em.clear();

			const loggedInClient = await apiClient.login(teacherAccount);

			return { loggedInClient, columnBoardNode, columnNode, cardNode, element, sibling };
		};

		it('should return status 204', async () => {
			const { element, loggedInClient } = await setup();

			const response = await loggedInClient.delete(element.id);

			expect(response.status).toEqual(204);
		});

		it('should actually delete element', async () => {
			const { element, loggedInClient } = await setup();

			await loggedInClient.delete(element.id);

			await expect(em.findOneOrFail(BoardNodeEntity, element.id)).rejects.toThrow();
		});

		it('should not delete siblings', async () => {
			const { element, sibling, loggedInClient } = await setup();

			await loggedInClient.delete(element.id);

			const siblingFromDb = await em.findOneOrFail(BoardNodeEntity, sibling.id);
			expect(siblingFromDb).toBeDefined();
		});
	});

	describe('with not authorized user', () => {
		const setup = async () => {
			await cleanupCollections(em);
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseEntityFactory.build({ teachers: [] });
			await em.persistAndFlush([teacherAccount, teacherUser, course]);

			const columnBoardNode = columnBoardEntityFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});
			const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
			const cardNode = cardEntityFactory.withParent(columnNode).build();
			const element = richTextElementEntityFactory.withParent(cardNode).build();
			const sibling = richTextElementEntityFactory.withParent(cardNode).build();

			await em.persistAndFlush([columnBoardNode, columnNode, cardNode, element, sibling]);
			em.clear();

			const loggedInClient = await apiClient.login(teacherAccount);

			return { loggedInClient, columnBoardNode, columnNode, cardNode, element, sibling };
		};

		it('should return status 403', async () => {
			const { element, loggedInClient } = await setup();

			const response = await loggedInClient.delete(element.id);

			expect(response.status).toEqual(403);
		});
	});

	describe('for drawing element', () => {
		describe('with authorized teacher user', () => {
			const drawingSetup = async () => {
				await cleanupCollections(em);
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const course = courseEntityFactory.build({ teachers: [teacherUser] });
				await em.persistAndFlush([teacherAccount, teacherUser, course]);

				const columnBoardNode = columnBoardEntityFactory.build({
					context: { id: course.id, type: BoardExternalReferenceType.Course },
				});
				const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
				const cardNode = cardEntityFactory.withParent(columnNode).build();
				const element = drawingElementEntityFactory.withParent(cardNode).build();

				filesStorageClientAdapterService.deleteFilesOfParent.mockResolvedValueOnce([]);
				drawingElementAdapterService.deleteDrawingBinData.mockResolvedValueOnce();

				await em.persistAndFlush([columnBoardNode, columnNode, cardNode, element]);
				em.clear();

				const loggedInClient = await apiClient.login(teacherAccount);

				return { element, loggedInClient };
			};

			it('should return status 204', async () => {
				const { element, loggedInClient } = await drawingSetup();

				const response = await loggedInClient.delete(element.id);

				expect(response.status).toEqual(204);
			});

			it('should actually delete element', async () => {
				const { element, loggedInClient } = await drawingSetup();

				await loggedInClient.delete(element.id);

				await expect(em.findOneOrFail(BoardNodeEntity, element.id)).rejects.toThrow();
			});
		});

		describe('with not logged in teacher user', () => {
			const drawingSetup = async () => {
				await cleanupCollections(em);
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const course = courseEntityFactory.build({ teachers: [teacherUser] });
				await em.persistAndFlush([teacherAccount, teacherUser, course]);

				const columnBoardNode = columnBoardEntityFactory.build({
					context: { id: course.id, type: BoardExternalReferenceType.Course },
				});
				const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
				const cardNode = cardEntityFactory.withParent(columnNode).build();
				const element = drawingElementEntityFactory.withParent(cardNode).build();

				filesStorageClientAdapterService.deleteFilesOfParent.mockResolvedValueOnce([]);
				drawingElementAdapterService.deleteDrawingBinData.mockResolvedValueOnce();

				await em.persistAndFlush([columnBoardNode, columnNode, cardNode, element]);
				em.clear();

				return { element };
			};

			it('should return status 204', async () => {
				const { element } = await drawingSetup();

				const response = await apiClient.delete(element.id);

				expect(response.status).toEqual(401);
			});
		});

		describe('with with unauthorized student user', () => {
			const drawingSetup = async () => {
				await cleanupCollections(em);
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				const course = courseEntityFactory.build({ teachers: [], students: [studentUser] });
				await em.persistAndFlush([studentAccount, studentUser, course]);

				const columnBoardNode = columnBoardEntityFactory.build({
					context: { id: course.id, type: BoardExternalReferenceType.Course },
				});
				const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
				const cardNode = cardEntityFactory.withParent(columnNode).build();
				const element = drawingElementEntityFactory.withParent(cardNode).build();

				filesStorageClientAdapterService.deleteFilesOfParent.mockResolvedValueOnce([]);
				drawingElementAdapterService.deleteDrawingBinData.mockResolvedValueOnce();

				await em.persistAndFlush([columnBoardNode, columnNode, cardNode, element]);
				em.clear();

				const loggedInClient = await apiClient.login(studentAccount);

				return { element, loggedInClient };
			};

			it('should return status 403', async () => {
				const { element, loggedInClient } = await drawingSetup();

				const response = await loggedInClient.delete(element.id);

				expect(response.status).toEqual(403);
			});
		});
	});
});
