import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser } from '@infra/auth-guard';
import { EntityManager } from '@mikro-orm/mongodb';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { ServerTestModule } from '@modules/server/server.module';
import { DrawingElementAdapterService } from '@modules/tldraw-client';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { cleanupCollections, courseFactory, mapUserToCurrentUser, userFactory } from '@shared/testing';
import { JwtAuthGuard } from '@src/infra/auth-guard/guard/jwt-auth.guard';
import { Request } from 'express';
import request from 'supertest';
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

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async delete(elementId: string) {
		const response = await request(this.app.getHttpServer())
			.delete(`${baseRouteName}/${elementId}`)
			.set('Accept', 'application/json');

		return {
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`content element delete (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let filesStorageClientAdapterService: DeepMocked<FilesStorageClientAdapterService>;
	let drawingElementAdapterService: DeepMocked<DrawingElementAdapterService>;
	let api: API;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideProvider(FilesStorageClientAdapterService)
			.useValue(createMock<FilesStorageClientAdapterService>())
			.overrideProvider(DrawingElementAdapterService)
			.useValue(createMock<DrawingElementAdapterService>())
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					req.user = currentUser;
					return true;
				},
			})
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		filesStorageClientAdapterService = module.get(FilesStorageClientAdapterService);
		drawingElementAdapterService = module.get(DrawingElementAdapterService);
		api = new API(app);
	});

	afterAll(async () => {
		await app.close();
	});

	const setup = async () => {
		await cleanupCollections(em);
		const user = userFactory.build();
		const course = courseFactory.build({ teachers: [user] });
		await em.persistAndFlush([user, course]);

		const columnBoardNode = columnBoardEntityFactory.build({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});
		const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
		const cardNode = cardEntityFactory.withParent(columnNode).build();
		const element = richTextElementEntityFactory.withParent(cardNode).build();
		const sibling = richTextElementEntityFactory.withParent(cardNode).build();

		await em.persistAndFlush([user, columnBoardNode, columnNode, cardNode, element, sibling]);
		em.clear();

		return { user, columnBoardNode, columnNode, cardNode, element, sibling };
	};

	describe('with valid user', () => {
		it('should return status 204', async () => {
			const { user, element } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const response = await api.delete(element.id);

			expect(response.status).toEqual(204);
		});

		it('should actually delete element', async () => {
			const { user, element } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.delete(element.id);

			await expect(em.findOneOrFail(BoardNodeEntity, element.id)).rejects.toThrow();
		});

		it('should not delete siblings', async () => {
			const { user, element, sibling } = await setup();
			currentUser = mapUserToCurrentUser(user);

			await api.delete(element.id);

			const siblingFromDb = await em.findOneOrFail(BoardNodeEntity, sibling.id);
			expect(siblingFromDb).toBeDefined();
		});
	});

	describe('with invalid user', () => {
		it('should return status 403', async () => {
			const { element } = await setup();

			const invalidUser = userFactory.build();
			await em.persistAndFlush([invalidUser]);
			currentUser = mapUserToCurrentUser(invalidUser);

			const response = await api.delete(element.id);

			expect(response.status).toEqual(403);
		});
	});

	describe('for drawing element', () => {
		const drawingSetup = async () => {
			await cleanupCollections(em);
			const teacher = userFactory.asTeacher().build();
			const student = userFactory.asStudent().build();
			const course = courseFactory.build({ teachers: [teacher], students: [student] });
			await em.persistAndFlush([teacher, student, course]);

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

			return { teacher, student, columnBoardNode, columnNode, cardNode, element };
		};

		describe('with valid user', () => {
			it('should return status 204', async () => {
				const { teacher, element } = await drawingSetup();
				currentUser = mapUserToCurrentUser(teacher);

				const response = await api.delete(element.id);

				expect(response.status).toEqual(204);
			});

			it('should actually delete element', async () => {
				const { teacher, element } = await drawingSetup();
				currentUser = mapUserToCurrentUser(teacher);

				await api.delete(element.id);

				await expect(em.findOneOrFail(BoardNodeEntity, element.id)).rejects.toThrow();
			});
		});

		describe('with invalid user', () => {
			it('should return status 403', async () => {
				const { element, student } = await drawingSetup();
				currentUser = mapUserToCurrentUser(student);

				const response = await api.delete(element.id);

				expect(response.status).toEqual(403);
			});
		});
	});
});
