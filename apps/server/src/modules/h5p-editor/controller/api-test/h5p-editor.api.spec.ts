import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TestRequest, UserAndAccountTestFactory } from '@shared/testing';
import { H5PEditorTestModule } from '../../h5p-editor-test.module';

describe('H5PEditor Controller (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let request: TestRequest;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [H5PEditorTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		request = new TestRequest(app, 'h5p-editor');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('get player', () => {
		describe('when user not exists', () => {
			it('should respond with unauthorized exception', async () => {
				const response = await request.get('dummyID/play');

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					type: 'UNAUTHORIZED',
					title: 'Unauthorized',
					message: 'Unauthorized',
					code: 401,
				});
			});
		});

		describe('when user is allowed to view player', () => {
			const createStudent = () => UserAndAccountTestFactory.buildStudent();

			const setup = async () => {
				const { studentAccount, studentUser } = createStudent();

				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				return { studentAccount };
			};

			it('should return the player', async () => {
				const { studentAccount } = await setup();

				const response = await request.get('dummyID/play', studentAccount);

				expect(response.statusCode).toEqual(HttpStatus.OK);
			});
		});
	});

	describe('get editor', () => {
		describe('when user not exists', () => {
			it('should respond with unauthorized exception', async () => {
				const response = await request.get('dummyID/edit');

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					type: 'UNAUTHORIZED',
					title: 'Unauthorized',
					message: 'Unauthorized',
					code: 401,
				});
			});
		});

		describe('when user is allowed to view editor', () => {
			const createStudent = () => UserAndAccountTestFactory.buildStudent();

			const setup = async () => {
				const { studentAccount, studentUser } = createStudent();

				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				return { studentAccount };
			};

			it('should return the editor', async () => {
				const { studentAccount } = await setup();

				const response = await request.get('dummyID/edit', studentAccount);

				expect(response.statusCode).toEqual(HttpStatus.OK);
			});
		});
	});
});
