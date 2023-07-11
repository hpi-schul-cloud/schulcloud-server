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
		const student = userFactory.build();
		const course = courseFactory.build({ teachers: [teacher], students: [student] });
		await em.persistAndFlush([teacher, student, course]);

		const columnBoardNode = columnBoardNodeFactory.buildWithId({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});

		const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });

		const cardNode = cardNodeFactory.buildWithId({ parent: columnNode });

		const taskNode = taskElementNodeFactory.buildWithId({ parent: cardNode });

		const submissionNode = submissionBoardNodeFactory.buildWithId({ parent: taskNode, userId: student.id });

		await em.persistAndFlush([columnBoardNode, columnNode, cardNode, taskNode, submissionNode]);
		em.clear();

		return { teacher, student, columnBoardNode, columnNode, cardNode, taskNode, submissionNode };
	};

	describe('with valid user', () => {});

	// TODO: add test cases
	// student can't delete submissions

	describe('with invalid user', () => {
		it('should return 403', async () => {
			const { submissionNode, cardNode } = await setup();
			const invalidUser = userFactory.build();
			await em.persistAndFlush([invalidUser]);
			currentUser = mapUserToCurrentUser(invalidUser);
			const response = await api.delete(submissionNode.id);
			const sub = await em.findOne(SubmissionBoardNode, { id: cardNode.id });
			expect(response.status).toEqual(403);
			expect(sub).toBeDefined();
		});
	});
});
