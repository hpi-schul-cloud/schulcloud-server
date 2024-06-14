import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { serverConfig, ServerTestModule, type ServerConfig } from '@modules/server';
import { ContextExternalToolEntity, ContextExternalToolType } from '@modules/tool/context-external-tool/entity';
import { contextExternalToolEntityFactory } from '@modules/tool/context-external-tool/testing';
import { externalToolEntityFactory } from '@modules/tool/external-tool/testing';
import { schoolExternalToolEntityFactory } from '@modules/tool/school-external-tool/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { BoardExternalReferenceType } from '../../../domain';
import { BoardNodeEntity } from '../../../repo';
import {
	mediaBoardEntityFactory,
	mediaExternalToolElementEntityFactory,
	mediaLineEntityFactory,
} from '../../../testing';
import { MoveElementBodyParams } from '../dto';

const baseRouteName = '/media-elements';

describe('Media Element (API)', () => {
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

	describe('[PUT] /media-elements/:lineId/position', () => {
		describe('when a valid user moves a element on their media board', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});
				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build();
				const mediaElementA = mediaExternalToolElementEntityFactory.withParent(mediaLine).build({ position: 0 });
				const mediaElementB = mediaExternalToolElementEntityFactory.withParent(mediaLine).build({ position: 1 });

				await em.persistAndFlush([studentAccount, studentUser, mediaBoard, mediaLine, mediaElementA, mediaElementB]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaLine,
					mediaElementA,
					mediaElementB,
				};
			};

			it('should move the element', async () => {
				const { studentClient, mediaLine, mediaElementA, mediaElementB } = await setup();

				const response = await studentClient.put<MoveElementBodyParams>(`${mediaElementA.id}/position`, {
					toLineId: mediaLine.id,
					toPosition: 1,
				});

				expect(response.status).toEqual(HttpStatus.NO_CONTENT);
				const modifiedElementA = await em.findOneOrFail(BoardNodeEntity, mediaElementA.id);
				const modifiedElementB = await em.findOneOrFail(BoardNodeEntity, mediaElementB.id);
				expect(modifiedElementA.position).toEqual(1);
				expect(modifiedElementB.position).toEqual(0);
			});
		});

		describe('when the media board feature is disabled', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = false;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});
				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build();
				const mediaElement = mediaExternalToolElementEntityFactory.withParent(mediaLine).build({ position: 0 });

				await em.persistAndFlush([studentAccount, studentUser, mediaBoard, mediaLine, mediaElement]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaBoard,
					mediaLine,
					mediaElement,
				};
			};

			it('should return forbidden', async () => {
				const { studentClient, mediaLine, mediaElement } = await setup();

				const response = await studentClient.put<MoveElementBodyParams>(`${mediaElement.id}/position`, {
					toLineId: mediaLine.id,
					toPosition: 0,
				});

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				expect(response.body).toEqual({
					code: HttpStatus.FORBIDDEN,
					message: 'Forbidden',
					title: 'Feature Disabled',
					type: 'FEATURE_DISABLED',
				});
			});
		});

		describe('when the user is invalid', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: new ObjectId().toHexString(),
						type: BoardExternalReferenceType.User,
					},
				});
				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build();
				const mediaElement = mediaExternalToolElementEntityFactory.withParent(mediaLine).build({ position: 0 });

				await em.persistAndFlush([mediaBoard, mediaLine]);
				em.clear();

				return {
					mediaBoard,
					mediaLine,
					mediaElement,
				};
			};

			it('should return unauthorized', async () => {
				const { mediaLine, mediaElement } = await setup();

				const response = await testApiClient.put<MoveElementBodyParams>(`${mediaElement.id}/position`, {
					toLineId: mediaLine.id,
					toPosition: 0,
				});

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					code: HttpStatus.UNAUTHORIZED,
					message: 'Unauthorized',
					title: 'Unauthorized',
					type: 'UNAUTHORIZED',
				});
			});
		});
	});

	describe('[POST] /media-elements', () => {
		describe('when a valid user creates a new element on their media board', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const externalTool = externalToolEntityFactory.build();
				const schoolExternalTool = schoolExternalToolEntityFactory.build({
					tool: externalTool,
					school: studentUser.school,
				});
				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});
				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build();

				await em.persistAndFlush([
					studentAccount,
					studentUser,
					mediaBoard,
					mediaLine,
					externalTool,
					schoolExternalTool,
				]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaLine,
					schoolExternalTool,
				};
			};

			it('should create a new element', async () => {
				const { studentClient, mediaLine, schoolExternalTool } = await setup();

				const response = await studentClient.post(undefined, {
					lineId: mediaLine.id,
					position: 0,
					schoolExternalToolId: schoolExternalTool.id,
				});

				expect(response.status).toEqual(HttpStatus.CREATED);
				expect(response.body).toEqual(
					expect.objectContaining({
						id: expect.any(String),
						content: {
							contextExternalToolId: expect.any(String),
						},
					})
				);
			});
		});

		describe('when the user is invalid', () => {
			const setup = () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;
			};

			it('should return unauthorized', async () => {
				setup();

				const response = await testApiClient.post(undefined, {
					lineId: new ObjectId().toHexString(),
					position: 0,
					schoolExternalToolId: new ObjectId().toHexString(),
				});

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					code: HttpStatus.UNAUTHORIZED,
					message: 'Unauthorized',
					title: 'Unauthorized',
					type: 'UNAUTHORIZED',
				});
			});
		});

		describe('when the media board feature is disabled', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = false;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
				};
			};

			it('should return forbidden', async () => {
				const { studentClient } = await setup();

				const response = await studentClient.post(undefined, {
					lineId: new ObjectId().toHexString(),
					position: 0,
					schoolExternalToolId: new ObjectId().toHexString(),
				});

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				expect(response.body).toEqual({
					code: HttpStatus.FORBIDDEN,
					message: 'Forbidden',
					title: 'Feature Disabled',
					type: 'FEATURE_DISABLED',
				});
			});
		});
	});

	describe('[DELETE] /media-elements/:elementId', () => {
		describe('when a valid user deletes an element on their media board', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const externalTool = externalToolEntityFactory.build();
				const schoolExternalTool = schoolExternalToolEntityFactory.build({
					tool: externalTool,
					school: studentUser.school,
				});
				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});
				const mediaLine = mediaLineEntityFactory.withParent(mediaBoard).build();
				const contextExternalTool = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalTool,
					contextType: ContextExternalToolType.MEDIA_BOARD,
					contextId: mediaBoard.id,
				});
				const mediaElement = mediaExternalToolElementEntityFactory
					.withParent(mediaLine)
					.build({ contextExternalToolId: contextExternalTool.id });

				await em.persistAndFlush([
					studentAccount,
					studentUser,
					mediaBoard,
					mediaLine,
					mediaElement,
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
					mediaElement,
					contextExternalToolId: contextExternalTool.id,
				};
			};

			it('should delete the element', async () => {
				const { studentClient, mediaElement, contextExternalToolId } = await setup();

				const response = await studentClient.delete(mediaElement.id);

				expect(response.status).toEqual(HttpStatus.NO_CONTENT);
				const deletedElement = await em.findOne(BoardNodeEntity, mediaElement.id);
				expect(deletedElement).toBeNull();

				const deletedContextExternalTool = await em.findOne(ContextExternalToolEntity, contextExternalToolId);
				expect(deletedContextExternalTool).toBeNull();
			});
		});

		describe('when the user is invalid', () => {
			const setup = () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = true;
			};

			it('should return unauthorized', async () => {
				setup();

				const response = await testApiClient.delete(new ObjectId().toHexString());

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					code: HttpStatus.UNAUTHORIZED,
					message: 'Unauthorized',
					title: 'Unauthorized',
					type: 'UNAUTHORIZED',
				});
			});
		});

		describe('when the media board feature is disabled', () => {
			const setup = async () => {
				const config: ServerConfig = serverConfig();
				config.FEATURE_MEDIA_SHELF_ENABLED = false;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
				};
			};

			it('should return forbidden', async () => {
				const { studentClient } = await setup();

				const response = await studentClient.delete(`${new ObjectId().toHexString()}`);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				expect(response.body).toEqual({
					code: HttpStatus.FORBIDDEN,
					message: 'Forbidden',
					title: 'Feature Disabled',
					type: 'FEATURE_DISABLED',
				});
			});
		});
	});
});
