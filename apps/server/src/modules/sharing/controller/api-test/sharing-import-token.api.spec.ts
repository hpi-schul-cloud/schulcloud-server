import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { CopyApiResponse, CopyElementType, CopyStatusEnum } from '@modules/copy-helper';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
	cleanupCollections,
	courseFactory,
	schoolEntityFactory,
	TestApiClient,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { Permission } from '@shared/domain/interface';
import { Course } from '@shared/domain/entity';
import { BoardExternalReferenceType } from '@modules/board';
import {
	cardEntityFactory,
	columnBoardEntityFactory,
	columnEntityFactory,
	externalToolElementEntityFactory,
} from '@modules/board/testing';
import { BoardNodeType } from '@modules/board/domain';
import { BoardNodeEntity } from '@modules/board/repo';
import { schoolExternalToolEntityFactory } from '@modules/tool/school-external-tool/testing';
import { contextExternalToolEntityFactory } from '@modules/tool/context-external-tool/testing';
import { ContextExternalToolEntity, ContextExternalToolType } from '@modules/tool/context-external-tool/entity';
import { ShareTokenContextType } from '../../domainobject/share-token.do';
import { shareTokenFactory } from '../../testing/share-token.factory';
import { ShareTokenImportBodyParams } from '../dto';

const baseRouteName = '/sharetoken';

describe(`share token import (api)`, () => {
	const getSubPath = (token: string): string => {
		const subPath = `/${token}/import`;
		return subPath;
	};

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

	beforeEach(() => {
		Configuration.set('FEATURE_COURSE_SHARE', true);
		Configuration.set('FEATURE_CTL_TOOLS_COPY_ENABLED', true);
		Configuration.set('FEATURE_COLUMN_BOARD_SHARE', true);
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	const setupSchoolExclusiveImport = async () => {
		await cleanupCollections(em);

		const school = schoolEntityFactory.buildWithId();
		const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
		const course = courseFactory.buildWithId({ teachers: [teacherUser], school: teacherUser.school });

		const shareToken = shareTokenFactory.withParentTypeCourse().build({
			parentId: course.id,
			contextType: ShareTokenContextType.School,
			contextId: school.id,
		});

		await em.persistAndFlush([teacherAccount, teacherUser, school, course, shareToken]);
		em.clear();

		const loggedInClient = await testApiClient.login(teacherAccount);

		return {
			loggedInClient,
			token: shareToken.token,
			elementType: CopyElementType.COURSE,
			course,
		};
	};

	describe('with the feature disabled', () => {
		it('should return status 500', async () => {
			Configuration.set('FEATURE_COURSE_SHARE', false);
			const { loggedInClient, token } = await setupSchoolExclusiveImport();

			const response = await loggedInClient.post(getSubPath(token), { newName: 'NewName' });

			expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
		});
	});

	describe('with a valid token', () => {
		it('should return status 201', async () => {
			const { loggedInClient, token } = await setupSchoolExclusiveImport();

			const response = await loggedInClient.post(getSubPath(token), { newName: 'NewName' });

			expect(response.status).toEqual(HttpStatus.CREATED);
		});

		it('should return a valid result', async () => {
			const { loggedInClient, token, elementType } = await setupSchoolExclusiveImport();
			const newName = 'NewName';
			const response = await loggedInClient.post(getSubPath(token), { newName });

			const expectedResult: CopyApiResponse = {
				id: expect.any(String),
				type: elementType,
				title: newName,
				status: CopyStatusEnum.SUCCESS,
			};

			expect(response.body).toEqual(expect.objectContaining(expectedResult));
		});

		describe('when doing a valid course import from another school', () => {
			const setupCrossSchoolImport = async () => {
				await cleanupCollections(em);

				const targetSchool = schoolEntityFactory.buildWithId();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school: targetSchool });

				const sourceSchool = schoolEntityFactory.buildWithId();
				const course = courseFactory.buildWithId({ school: sourceSchool });

				const shareToken = shareTokenFactory.withParentTypeCourse().build({
					parentId: course.id,
					contextType: undefined,
					contextId: undefined,
				});

				await em.persistAndFlush([teacherAccount, teacherUser, targetSchool, course, shareToken]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, token: shareToken.token, elementType: CopyElementType.COURSE, targetSchool, course };
			};

			describe('when the course has course tools', () => {
				describe('when the importing school has the proper school external tool', () => {
					const setupExistingSchoolTool = async () => {
						const { loggedInClient, token, elementType, targetSchool, course } = await setupCrossSchoolImport();

						const sourceSchoolTool = schoolExternalToolEntityFactory.buildWithId({
							school: course.school,
						});

						const sourceCourseTools = contextExternalToolEntityFactory.buildList(2, {
							schoolTool: sourceSchoolTool,
							contextType: ContextExternalToolType.COURSE,
							contextId: course.id,
						});

						const targetSchoolTool = schoolExternalToolEntityFactory.buildWithId({
							school: targetSchool,
							tool: sourceSchoolTool.tool,
						});

						await em.persistAndFlush([targetSchoolTool, sourceSchoolTool, ...sourceCourseTools]);
						em.clear();

						return {
							loggedInClient,
							token,
							elementType,
							targetSchool,
							targetSchoolTool,
						};
					};

					it('should return status 201', async () => {
						const { loggedInClient, token } = await setupExistingSchoolTool();

						const response = await loggedInClient.post(getSubPath(token), { newName: 'NewName' });

						expect(response.status).toEqual(201);
					});

					it('should return a valid response body', async () => {
						const { loggedInClient, token, elementType } = await setupExistingSchoolTool();

						const newName = 'newName';
						const response = await loggedInClient.post(getSubPath(token), { newName });
						const body = response.body as CopyApiResponse;

						const expectedResult: CopyApiResponse = {
							id: expect.any(String),
							type: elementType,
							title: newName,
							status: CopyStatusEnum.SUCCESS,
						};

						expect(body).toEqual(expect.objectContaining(expectedResult));
					});

					it('should save the copied course and course tools with the correct external school id', async () => {
						const { loggedInClient, token, targetSchool, targetSchoolTool } = await setupExistingSchoolTool();

						const newName = 'newName';
						const response = await loggedInClient.post(getSubPath(token), { newName });

						expect(response.status).toEqual(201);

						const copiedCourse: Course = await em.findOneOrFail(Course, { school: targetSchool });
						const persistedCourseTools: ContextExternalToolEntity[] = await em.find(ContextExternalToolEntity, {
							contextType: ContextExternalToolType.COURSE,
						});
						const copiedCourseTools: ContextExternalToolEntity[] = persistedCourseTools.filter(
							(courseTool) => courseTool.contextId.toHexString() === copiedCourse.id
						);

						expect(copiedCourseTools.length).toEqual(2);
						copiedCourseTools.forEach((copiedTool) => {
							expect(copiedTool.schoolTool.id).toEqual(targetSchoolTool.id);
						});
					});
				});

				describe('when the importing school does not have the proper school external tool', () => {
					const setupNonExistingSchoolTool = async () => {
						const { loggedInClient, token, elementType, targetSchool, course } = await setupCrossSchoolImport();

						const sourceSchoolTool = schoolExternalToolEntityFactory.buildWithId({
							school: course.school,
						});

						const sourceCourseTools = contextExternalToolEntityFactory.buildList(2, {
							schoolTool: sourceSchoolTool,
							contextType: ContextExternalToolType.COURSE,
							contextId: course.id,
						});

						await em.persistAndFlush([sourceSchoolTool, ...sourceCourseTools]);
						em.clear();

						return { loggedInClient, token, elementType, targetSchool };
					};

					it('should return status 201', async () => {
						const { loggedInClient, token } = await setupNonExistingSchoolTool();

						const response = await loggedInClient.post(getSubPath(token), { newName: 'NewName' });

						expect(response.status).toEqual(201);
					});

					it('should return a valid response body', async () => {
						const { loggedInClient, token, elementType } = await setupNonExistingSchoolTool();

						const newName = 'newName';
						const response = await loggedInClient.post(getSubPath(token), { newName });
						const body = response.body as CopyApiResponse;

						const expectedResult: CopyApiResponse = {
							id: expect.any(String),
							type: elementType,
							title: newName,
							status: CopyStatusEnum.SUCCESS,
						};

						expect(body).toEqual(expect.objectContaining(expectedResult));
					});

					it('should save the copied course', async () => {
						const { loggedInClient, token, targetSchool } = await setupNonExistingSchoolTool();

						const response = await loggedInClient.post(getSubPath(token), { newName: 'newName' });

						expect(response.status).toEqual(201);

						await em.findOneOrFail(Course, { school: targetSchool });
					});

					it('should not save the course tools', async () => {
						const { loggedInClient, token, targetSchool } = await setupNonExistingSchoolTool();

						const response = await loggedInClient.post(getSubPath(token), { newName: 'newName' });

						expect(response.status).toEqual(201);

						const copiedCourse: Course = await em.findOneOrFail(Course, { school: targetSchool });
						const persistedCourseTools: ContextExternalToolEntity[] = await em.find(ContextExternalToolEntity, {
							contextType: ContextExternalToolType.COURSE,
						});

						const courseTools: ContextExternalToolEntity[] = persistedCourseTools.filter(
							(courseTool) => courseTool.contextId.toHexString() === copiedCourse.id
						);
						expect(courseTools.length).toEqual(0);
					});
				});
			});

			describe('when the course has boards with tool elements', () => {
				const setupBoardEntitiesWithTools = (
					course: Course,
					boardToolOne: ContextExternalToolEntity,
					boardToolTwo: ContextExternalToolEntity
				) => {
					const columnBoardNode = columnBoardEntityFactory.build({
						context: {
							type: BoardExternalReferenceType.Course,
							id: course.id,
						},
					});

					const columnNode = columnEntityFactory.withParent(columnBoardNode).build();

					const cardNode = cardEntityFactory.withParent(columnNode).build();

					const boardToolElementOne = externalToolElementEntityFactory.withParent(cardNode).build({
						position: 0,
						contextExternalToolId: boardToolOne.id,
					});

					const boardToolElementTwo = externalToolElementEntityFactory.withParent(cardNode).build({
						position: 1,
						contextExternalToolId: boardToolTwo.id,
					});

					em.persist([columnBoardNode, columnNode, cardNode, boardToolElementOne, boardToolElementTwo]);
				};

				describe('when the importing school has the proper school external tool', () => {
					const setupExistingSchoolTool = async () => {
						const { loggedInClient, token, elementType, targetSchool, course } = await setupCrossSchoolImport();

						const sourceSchoolTool = schoolExternalToolEntityFactory.buildWithId({
							school: course.school,
						});

						const sourceBoardToolOne = contextExternalToolEntityFactory.buildWithId({
							schoolTool: sourceSchoolTool,
							contextType: ContextExternalToolType.BOARD_ELEMENT,
							contextId: new ObjectId().toHexString(),
						});

						const sourceBoardToolTwo = contextExternalToolEntityFactory.buildWithId({
							schoolTool: sourceSchoolTool,
							contextType: ContextExternalToolType.BOARD_ELEMENT,
							contextId: new ObjectId().toHexString(),
						});

						const targetSchoolTool = schoolExternalToolEntityFactory.buildWithId({
							tool: sourceSchoolTool.tool,
							school: targetSchool,
						});

						setupBoardEntitiesWithTools(course, sourceBoardToolOne, sourceBoardToolTwo);

						await em.persistAndFlush([targetSchoolTool, sourceSchoolTool, sourceBoardToolOne, sourceBoardToolTwo]);
						em.clear();

						return { loggedInClient, token, elementType, targetSchool, targetSchoolTool };
					};

					it('should save the copied course', async () => {
						const { loggedInClient, token, targetSchool } = await setupExistingSchoolTool();

						const response = await loggedInClient.post(getSubPath(token), { newName: 'newName' });

						expect(response.status).toEqual(201);

						await em.findOneOrFail(Course, { school: targetSchool });
					});

					it('should copy the board tools and reassign them to the correct school external tool', async () => {
						const { loggedInClient, token, targetSchoolTool } = await setupExistingSchoolTool();

						const response = await loggedInClient.post(getSubPath(token), { newName: 'newName' });

						expect(response.status).toEqual(201);

						const persistedBoardTools: ContextExternalToolEntity[] = await em.find(ContextExternalToolEntity, {
							contextType: ContextExternalToolType.BOARD_ELEMENT,
						});
						const copiedBoardTools = persistedBoardTools.filter(
							(boardTool) => boardTool.schoolTool.id === targetSchoolTool.id
						);

						expect(copiedBoardTools.length).toEqual(2);
					});
				});

				describe('when the importing school does not have the proper school external tool', () => {
					const setupNonExistingSchoolTool = async () => {
						const { loggedInClient, token, elementType, targetSchool, course } = await setupCrossSchoolImport();

						const sourceSchoolTool = schoolExternalToolEntityFactory.buildWithId({
							school: course.school,
						});

						const sourceBoardToolOne = contextExternalToolEntityFactory.buildWithId({
							schoolTool: sourceSchoolTool,
							contextType: ContextExternalToolType.BOARD_ELEMENT,
							contextId: new ObjectId().toHexString(),
						});

						const sourceBoardToolTwo = contextExternalToolEntityFactory.buildWithId({
							schoolTool: sourceSchoolTool,
							contextType: ContextExternalToolType.BOARD_ELEMENT,
							contextId: new ObjectId().toHexString(),
						});

						setupBoardEntitiesWithTools(course, sourceBoardToolOne, sourceBoardToolTwo);

						await em.persistAndFlush([sourceSchoolTool, sourceBoardToolOne, sourceBoardToolTwo]);
						em.clear();

						return { loggedInClient, token, elementType, targetSchool };
					};

					it('should save the copied course', async () => {
						const { loggedInClient, token, targetSchool } = await setupNonExistingSchoolTool();

						const response = await loggedInClient.post(getSubPath(token), { newName: 'newName' });

						expect(response.status).toEqual(201);

						await em.findOneOrFail(Course, { school: targetSchool });
					});

					it('should not copy the board tools and replace them with deleted elements', async () => {
						const { loggedInClient, token } = await setupNonExistingSchoolTool();

						const response = await loggedInClient.post(getSubPath(token), { newName: 'newName' });

						expect(response.status).toEqual(201);

						const deletedElementNodes: BoardNodeEntity[] = await em.find(BoardNodeEntity, {
							type: BoardNodeType.DELETED_ELEMENT,
						});
						const persistedBoardTools: ContextExternalToolEntity[] = await em.find(ContextExternalToolEntity, {
							contextType: ContextExternalToolType.BOARD_ELEMENT,
						});

						expect(deletedElementNodes.length).toEqual(2);
						expect(persistedBoardTools.length).not.toBeGreaterThan(2);
					});
				});
			});
		});

		describe('when doing a valid board import from another school', () => {
			const setupCrossSchoolImport = async () => {
				await cleanupCollections(em);

				const targetSchool = schoolEntityFactory.buildWithId();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school: targetSchool }, [
					Permission.COURSE_EDIT,
				]);

				const targetCourse = courseFactory.buildWithId({
					school: targetSchool,
					teachers: [teacherUser],
				});

				const sourceSchool = schoolEntityFactory.buildWithId();
				const sourceCourse = courseFactory.buildWithId({ school: sourceSchool });

				const columnBoardNode = columnBoardEntityFactory.build({
					context: {
						id: sourceCourse.id,
						type: BoardExternalReferenceType.Course,
					},
				});

				const shareToken = shareTokenFactory.withParentTypeBoard().build({
					parentId: columnBoardNode.id,
					contextType: undefined,
					contextId: undefined,
				});

				await em.persistAndFlush([
					teacherAccount,
					teacherUser,
					targetSchool,
					targetCourse,
					sourceCourse,
					shareToken,
					columnBoardNode,
				]);

				const loggedInClient = await testApiClient.login(teacherAccount);

				return {
					loggedInClient,
					token: shareToken.token,
					targetSchool,
					targetCourse,
					sourceCourse,
					columnBoardNode,
				};
			};

			describe('when the board has tool elements', () => {
				const populateColumnBoardWithTools = (
					columnBoardNode: BoardNodeEntity,
					boardToolOne: ContextExternalToolEntity,
					boardToolTwo: ContextExternalToolEntity
				) => {
					const columnNode = columnEntityFactory.withParent(columnBoardNode).build();

					const cardNode = cardEntityFactory.withParent(columnNode).build();

					const boardToolElementOne = externalToolElementEntityFactory.withParent(cardNode).build({
						position: 0,
						contextExternalToolId: boardToolOne.id,
					});

					const boardToolElementTwo = externalToolElementEntityFactory.withParent(cardNode).build({
						position: 1,
						contextExternalToolId: boardToolTwo.id,
					});

					em.persist([columnBoardNode, columnNode, cardNode, boardToolElementOne, boardToolElementTwo]);
				};

				describe('when the importing school has the proper school external tool', () => {
					const setupExistingSchoolTool = async () => {
						const { loggedInClient, token, targetSchool, targetCourse, sourceCourse, columnBoardNode } =
							await setupCrossSchoolImport();

						const sourceSchoolTool = schoolExternalToolEntityFactory.buildWithId({
							school: sourceCourse.school,
						});

						const sourceBoardToolOne = contextExternalToolEntityFactory.buildWithId({
							schoolTool: sourceSchoolTool,
							contextType: ContextExternalToolType.BOARD_ELEMENT,
							contextId: new ObjectId().toHexString(),
						});

						const sourceBoardToolTwo = contextExternalToolEntityFactory.buildWithId({
							schoolTool: sourceSchoolTool,
							contextType: ContextExternalToolType.BOARD_ELEMENT,
							contextId: new ObjectId().toHexString(),
						});

						const targetSchoolTool = schoolExternalToolEntityFactory.buildWithId({
							tool: sourceSchoolTool.tool,
							school: targetSchool,
						});

						populateColumnBoardWithTools(columnBoardNode, sourceBoardToolOne, sourceBoardToolTwo);

						await em.persistAndFlush([targetSchoolTool, sourceSchoolTool, sourceBoardToolOne, sourceBoardToolTwo]);
						em.clear();

						return { loggedInClient, token, targetSchool, targetSchoolTool, targetCourse };
					};

					it('should save the copied board', async () => {
						const { loggedInClient, token, targetCourse } = await setupExistingSchoolTool();

						const data: ShareTokenImportBodyParams = {
							newName: 'newName',
							destinationCourseId: targetCourse.id,
						};
						const response = await loggedInClient.post(getSubPath(token), data);

						expect(response.status).toEqual(201);

						const columnBoardNodes: BoardNodeEntity[] = await em.find(BoardNodeEntity, {
							type: BoardNodeType.COLUMN_BOARD,
						});
						const copiedColumnBoardNode: BoardNodeEntity | undefined = columnBoardNodes.find(
							(node) => node.context?.id === targetCourse.id
						);
						expect(copiedColumnBoardNode).not.toBeUndefined();
					});

					it('should copy the board tools and reassign them to the correct school external tool', async () => {
						const { loggedInClient, token, targetSchoolTool, targetCourse } = await setupExistingSchoolTool();

						const data: ShareTokenImportBodyParams = {
							newName: 'newName',
							destinationCourseId: targetCourse.id,
						};
						const response = await loggedInClient.post(getSubPath(token), data);

						expect(response.status).toEqual(201);

						const persistedBoardTools: ContextExternalToolEntity[] = await em.find(ContextExternalToolEntity, {
							contextType: ContextExternalToolType.BOARD_ELEMENT,
						});
						const copiedBoardTools = persistedBoardTools.filter(
							(boardTool) => boardTool.schoolTool.id === targetSchoolTool.id
						);

						expect(copiedBoardTools.length).toEqual(2);
					});
				});

				describe('when the importing school does not have the proper school external tool', () => {
					const setupNonExistingSchoolTool = async () => {
						const { loggedInClient, token, targetSchool, targetCourse, sourceCourse, columnBoardNode } =
							await setupCrossSchoolImport();

						const sourceSchoolTool = schoolExternalToolEntityFactory.buildWithId({
							school: sourceCourse.school,
						});

						const sourceBoardToolOne = contextExternalToolEntityFactory.buildWithId({
							schoolTool: sourceSchoolTool,
							contextType: ContextExternalToolType.BOARD_ELEMENT,
							contextId: new ObjectId().toHexString(),
						});

						const sourceBoardToolTwo = contextExternalToolEntityFactory.buildWithId({
							schoolTool: sourceSchoolTool,
							contextType: ContextExternalToolType.BOARD_ELEMENT,
							contextId: new ObjectId().toHexString(),
						});

						populateColumnBoardWithTools(columnBoardNode, sourceBoardToolOne, sourceBoardToolTwo);

						await em.persistAndFlush([sourceSchoolTool, sourceBoardToolOne, sourceBoardToolTwo]);
						em.clear();

						return { loggedInClient, token, targetSchool, targetCourse };
					};

					it('should save the copied board', async () => {
						const { loggedInClient, token, targetCourse } = await setupNonExistingSchoolTool();

						const data: ShareTokenImportBodyParams = {
							newName: 'newName',
							destinationCourseId: targetCourse.id,
						};
						const response = await loggedInClient.post(getSubPath(token), data);

						expect(response.status).toEqual(201);

						const columnBoardNodes: BoardNodeEntity[] = await em.find(BoardNodeEntity, {
							type: BoardNodeType.COLUMN_BOARD,
						});
						const copiedColumnBoardNode: BoardNodeEntity | undefined = columnBoardNodes.find(
							(node) => node.context?.id === targetCourse.id
						);
						expect(copiedColumnBoardNode).not.toBeUndefined();
					});

					it('should not copy the board tools and replace them with deleted elements', async () => {
						const { loggedInClient, token, targetCourse } = await setupNonExistingSchoolTool();

						const data: ShareTokenImportBodyParams = {
							newName: 'newName',
							destinationCourseId: targetCourse.id,
						};
						const response = await loggedInClient.post(getSubPath(token), data);

						expect(response.status).toEqual(201);

						const deletedElementNodes: BoardNodeEntity[] = await em.find(BoardNodeEntity, {
							type: BoardNodeType.DELETED_ELEMENT,
						});
						const persistedBoardContextTools: ContextExternalToolEntity[] = await em.find(ContextExternalToolEntity, {
							contextType: ContextExternalToolType.BOARD_ELEMENT,
						});
						const persistedBoardToolElements: BoardNodeEntity[] = await em.find(BoardNodeEntity, {
							type: BoardNodeType.EXTERNAL_TOOL,
						});

						expect(deletedElementNodes.length).toEqual(2);
						expect(persistedBoardContextTools.length).not.toBeGreaterThan(2);
						expect(persistedBoardToolElements.length).not.toBeGreaterThan(2);
					});
				});
			});
		});
	});

	describe('with invalid token', () => {
		it('should return status 404', async () => {
			const { loggedInClient } = await setupSchoolExclusiveImport();

			const response = await loggedInClient.post(getSubPath('invalid_token'), { newName: 'NewName' });

			expect(response.status).toEqual(HttpStatus.NOT_FOUND);
		});
	});

	describe('with invalid context', () => {
		const setupInvalidTokenContext = async () => {
			await cleanupCollections(em);

			const school = schoolEntityFactory.buildWithId();
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
			const course = courseFactory.buildWithId({ teachers: [teacherUser], school: teacherUser.school });

			const otherSchool = schoolEntityFactory.buildWithId();

			const shareToken = shareTokenFactory.withParentTypeCourse().build({
				parentId: course.id,
				contextType: ShareTokenContextType.School,
				contextId: otherSchool.id,
			});

			await em.persistAndFlush([teacherUser, teacherAccount, school, course, otherSchool, shareToken]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return {
				loggedInClient,
				shareTokenFromDifferentCourse: shareToken.token,
			};
		};

		it('should return status 403', async () => {
			const { loggedInClient, shareTokenFromDifferentCourse } = await setupInvalidTokenContext();

			const response = await loggedInClient.post(getSubPath(shareTokenFromDifferentCourse), { newName: 'NewName' });

			expect(response.status).toEqual(HttpStatus.FORBIDDEN);
		});
	});

	describe('with invalid new name', () => {
		it('should return status 501', async () => {
			const { loggedInClient, token } = await setupSchoolExclusiveImport();

			const response = await loggedInClient.post(getSubPath(token), { newName: 42 });

			expect(response.status).toEqual(HttpStatus.NOT_IMPLEMENTED);
		});
	});
});
