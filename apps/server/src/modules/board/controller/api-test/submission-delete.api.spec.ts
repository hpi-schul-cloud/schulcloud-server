import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { BoardExternalReferenceType, SubmissionBoardNode } from '@shared/domain';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	mapUserToCurrentUser,
	submissionBoardNodeFactory,
	taskElementNodeFactory,
	userFactory,
} from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server';
import { Request } from 'express';
import request from 'supertest';
import { SubmissionResponse } from '../dto/submission';

const baseRouteName = '/elements/submissions';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async delete(submissionId: string) {
		const response = await request(this.app.getHttpServer())
			.delete(`${baseRouteName}/${submissionId}`)
			.set('Accept', 'application/json')
			.send();

		return {
			result: response.body as SubmissionResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe('submission create (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let api: API;

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
		api = new API(app);
	});

	afterAll(async () => {
		await app.close();
	});

	const setup = async () => {
		await cleanupCollections(em);
		const teacher = userFactory.build();
		const student1 = userFactory.build();
		const student2 = userFactory.build();
		const course = courseFactory.build({ teachers: [teacher], students: [student1, student2] });
		await em.persistAndFlush([teacher, student1, student2, course]);

		const columnBoardNode = columnBoardNodeFactory.buildWithId({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});

		const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });

		const cardNode = cardNodeFactory.buildWithId({ parent: columnNode });

		const taskNode = taskElementNodeFactory.buildWithId({ parent: cardNode });

		const submissionNode1 = submissionBoardNodeFactory.buildWithId({ parent: taskNode, userId: student1.id });
		const submissionNode2 = submissionBoardNodeFactory.buildWithId({ parent: taskNode, userId: student2.id });

		await em.persistAndFlush([columnBoardNode, columnNode, cardNode, taskNode, submissionNode1, submissionNode2]);
		em.clear();

		return {
			teacher,
			student1,
			student2,
			columnBoardNode,
			columnNode,
			cardNode,
			taskNode,
			submissionNode1,
			submissionNode2,
		};
	};

	describe('with valid user', () => {
		it('should return status 204 when teacher', async () => {
			const { submissionNode1, teacher } = await setup();
			currentUser = mapUserToCurrentUser(teacher);

			const response = await api.delete(submissionNode1.id);

			expect(response.status).toEqual(204);
		});

		it('should actually delete submission board', async () => {
			const { submissionNode1, teacher } = await setup();
			currentUser = mapUserToCurrentUser(teacher);

			await api.delete(submissionNode1.id);
			await expect(em.findOneOrFail(SubmissionBoardNode, submissionNode1.id)).rejects.toThrow();
		});

		it('should not delete siblings', async () => {
			const { submissionNode1, submissionNode2, teacher } = await setup();
			currentUser = mapUserToCurrentUser(teacher);

			await api.delete(submissionNode1.id);

			const siblingFromDb = await em.findOneOrFail(SubmissionBoardNode, submissionNode2.id);
			expect(siblingFromDb).toBeDefined();
		});

		it('should return status 403 when student', async () => {
			const { submissionNode1, student1 } = await setup();
			currentUser = mapUserToCurrentUser(student1);

			const response = await api.delete(submissionNode1.id);

			expect(response.status).toEqual(403);
		});
	});

	describe('with invalid user', () => {
		it('should return 403', async () => {
			const { submissionNode1, cardNode } = await setup();
			const invalidUser = userFactory.build();
			await em.persistAndFlush([invalidUser]);
			currentUser = mapUserToCurrentUser(invalidUser);
			const response = await api.delete(submissionNode1.id);
			const sub = await em.findOne(SubmissionBoardNode, { id: cardNode.id });
			expect(response.status).toEqual(403);
			expect(sub).toBeDefined();
		});
	});
});
