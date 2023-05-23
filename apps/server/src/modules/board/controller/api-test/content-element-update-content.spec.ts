import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType, TextElementNode } from '@shared/domain';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	mapUserToCurrentUser,
	TestApiClient,
	textElementNodeFactory,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server/server.module';
import { Request } from 'express';

describe(`content element update content (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let request: TestApiClient;
	let currentUser: ICurrentUser;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
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
		request = new TestApiClient(app, 'elements');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('with valid user', () => {
		const setup = async () => {
			await cleanupCollections(em);
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

			const course = courseFactory.build({ teachers: [teacherUser] });
			await em.persistAndFlush([teacherUser, course]);

			const columnBoardNode = columnBoardNodeFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const column = columnNodeFactory.buildWithId({ parent: columnBoardNode });
			const parentCard = cardNodeFactory.buildWithId({ parent: column });
			const element = textElementNodeFactory.buildWithId({ parent: parentCard });

			await em.persistAndFlush([teacherAccount, teacherUser, parentCard, column, columnBoardNode, element]);
			em.clear();

			return { teacherAccount, teacherUser, parentCard, column, columnBoardNode, element };
		};

		it('should return status 204', async () => {
			const { teacherAccount, teacherUser, element } = await setup();

			currentUser = mapUserToCurrentUser(teacherUser);

			const response = await request.put(
				`${element.id}/content`,
				{ data: { content: { text: 'hello world' }, type: 'text' } },
				teacherAccount
			);

			expect(response.statusCode).toEqual(204);
		});

		it('should actually change content of the element', async () => {
			const { teacherAccount, teacherUser, element } = await setup();

			currentUser = mapUserToCurrentUser(teacherUser);

			await request.put(
				`${element.id}/content`,
				{ data: { content: { text: 'hello world' }, type: 'text' } },
				teacherAccount
			);
			const result = await em.findOneOrFail(TextElementNode, element.id);

			expect(result.text).toEqual('hello world');
		});
	});

	describe('with invalid user', () => {
		const setup = async () => {
			await cleanupCollections(em);
			const { teacherUser: invalidTeacherUser, teacherAccount: invalidTeacherAccount } =
				UserAndAccountTestFactory.buildTeacher();

			const course = courseFactory.build({ teachers: [] });
			await em.persistAndFlush([invalidTeacherUser, invalidTeacherAccount, course]);

			const columnBoardNode = columnBoardNodeFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const column = columnNodeFactory.buildWithId({ parent: columnBoardNode });
			const parentCard = cardNodeFactory.buildWithId({ parent: column });
			const element = textElementNodeFactory.buildWithId({ parent: parentCard });

			await em.persistAndFlush([parentCard, column, columnBoardNode, element]);
			em.clear();

			return { invalidTeacherAccount, invalidTeacherUser, parentCard, column, columnBoardNode, element };
		};

		it('should return status 403', async () => {
			const { invalidTeacherAccount, invalidTeacherUser, element } = await setup();

			currentUser = mapUserToCurrentUser(invalidTeacherUser);

			const response = await request.put(
				`${element.id}/content`,
				{ data: { content: { text: 'hello world' }, type: 'text' } },
				invalidTeacherAccount
			);

			expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
		});
	});
});
