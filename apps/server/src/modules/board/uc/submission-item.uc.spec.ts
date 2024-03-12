import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Action, AuthorizationService } from '@modules/authorization';
import {
	BadRequestException,
	ForbiddenException,
	NotFoundException,
	UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardDoAuthorizable, BoardRoles, ContentElementType } from '@shared/domain/domainobject';
import {
	columnBoardFactory,
	fileElementFactory,
	richTextElementFactory,
	setupEntities,
	submissionContainerElementFactory,
	submissionItemFactory,
	userFactory,
} from '@shared/testing';
import { Logger } from '@src/core/logger';
import { BoardDoAuthorizableService, ContentElementService, SubmissionItemService } from '../service';
import { SubmissionItemUc } from './submission-item.uc';

describe(SubmissionItemUc.name, () => {
	let module: TestingModule;
	let uc: SubmissionItemUc;
	let authorizationService: DeepMocked<AuthorizationService>;
	let boardDoAuthorizableService: DeepMocked<BoardDoAuthorizableService>;
	let elementService: DeepMocked<ContentElementService>;
	let submissionItemService: DeepMocked<SubmissionItemService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SubmissionItemUc,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: BoardDoAuthorizableService,
					useValue: createMock<BoardDoAuthorizableService>(),
				},
				{
					provide: ContentElementService,
					useValue: createMock<ContentElementService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: SubmissionItemService,
					useValue: createMock<SubmissionItemService>(),
				},
			],
		}).compile();

		uc = module.get(SubmissionItemUc);
		authorizationService = module.get(AuthorizationService);
		authorizationService.checkPermission.mockImplementation(() => {});
		boardDoAuthorizableService = module.get(BoardDoAuthorizableService);
		elementService = module.get(ContentElementService);
		submissionItemService = module.get(SubmissionItemService);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findSubmissionItems', () => {
		describe('user is student', () => {
			const setup = () => {
				const user1 = userFactory.buildWithId();
				const user2 = userFactory.buildWithId();
				const submissionItem1 = submissionItemFactory.build({
					userId: user1.id,
				});
				const submissionItem2 = submissionItemFactory.build({
					userId: user2.id,
				});
				const submissionContainerEl = submissionContainerElementFactory.build({
					children: [submissionItem1, submissionItem2],
				});

				boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValue(
					new BoardDoAuthorizable({
						users: [
							{ userId: user1.id, roles: [BoardRoles.READER] },
							{ userId: user2.id, roles: [BoardRoles.READER] },
						],
						id: submissionContainerEl.id,
						boardDo: submissionContainerEl,
						rootDo: columnBoardFactory.build(),
					})
				);

				const elementSpy = elementService.findById.mockResolvedValueOnce(submissionContainerEl);

				return { submissionContainerEl, submissionItem1, user1, elementSpy };
			};

			it('student1 should only get their own submission item', async () => {
				const { user1, submissionContainerEl, submissionItem1 } = setup();
				const { submissionItems } = await uc.findSubmissionItems(user1.id, submissionContainerEl.id);
				expect(submissionItems.length).toBe(1);
				expect(submissionItems[0]).toStrictEqual(submissionItem1);
			});
			it('student should not get a list of users', async () => {
				const { user1, submissionContainerEl } = setup();
				const { users } = await uc.findSubmissionItems(user1.id, submissionContainerEl.id);
				expect(users.length).toBe(0);
			});
		});
		describe('when user is a teacher', () => {
			const setup = () => {
				const teacher = userFactory.buildWithId();
				const student1 = userFactory.buildWithId();
				const student2 = userFactory.buildWithId();
				const submissionItem1 = submissionItemFactory.build({
					userId: student1.id,
				});
				const submissionItem2 = submissionItemFactory.build({
					userId: student2.id,
				});
				const submissionContainerEl = submissionContainerElementFactory.build({
					children: [submissionItem1, submissionItem2],
				});

				boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValue(
					new BoardDoAuthorizable({
						users: [
							{ userId: teacher.id, roles: [BoardRoles.EDITOR] },
							{ userId: student1.id, roles: [BoardRoles.READER] },
							{ userId: student2.id, roles: [BoardRoles.READER] },
						],
						id: submissionContainerEl.id,
						boardDo: submissionContainerEl,
						rootDo: columnBoardFactory.build(),
					})
				);

				const elementSpy = elementService.findById.mockResolvedValue(submissionContainerEl);

				return { submissionContainerEl, submissionItem1, submissionItem2, teacher, elementSpy };
			};

			it('teacher should get all submission items', async () => {
				const { teacher, submissionContainerEl, submissionItem1, submissionItem2 } = setup();
				const { submissionItems } = await uc.findSubmissionItems(teacher.id, submissionContainerEl.id);
				expect(submissionItems.length).toBe(2);
				expect(submissionItems.map((item) => item.id)).toContain(submissionItem1.id);
				expect(submissionItems.map((item) => item.id)).toContain(submissionItem2.id);
			});
			it('teacher should get list of students', async () => {
				const { teacher, submissionContainerEl } = setup();
				const { users } = await uc.findSubmissionItems(teacher.id, submissionContainerEl.id);
				expect(users.length).toBe(2);
			});
		});
		describe('when called with wrong board node', () => {
			const setup = () => {
				const teacher = userFactory.buildWithId();
				const fileEl = fileElementFactory.build();
				elementService.findById.mockResolvedValue(fileEl);

				return { teacher, fileEl };
			};

			it('should throw HttpException', async () => {
				const { teacher, fileEl } = setup();

				await expect(uc.findSubmissionItems(teacher.id, fileEl.id)).rejects.toThrow(
					new NotFoundException('Could not find a submission container with this id')
				);
			});
		});
	});

	describe('updateSubmissionItem', () => {
		const setup = () => {
			const user = userFactory.buildWithId();

			const columnBoard = columnBoardFactory.build();
			const submissionItem = submissionItemFactory.build({
				userId: user.id,
			});

			submissionItemService.findById.mockResolvedValueOnce(submissionItem);

			return { submissionItem, columnBoard, user, boardDoAuthorizableService };
		};

		it('should call service to find the submission item ', async () => {
			const { submissionItem, user } = setup();
			await uc.updateSubmissionItem(user.id, submissionItem.id, false);
			expect(submissionItemService.findById).toHaveBeenCalledWith(submissionItem.id);
		});

		it('should authorize', async () => {
			const { submissionItem, user, columnBoard } = setup();

			boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValue(
				new BoardDoAuthorizable({
					users: [{ userId: user.id, roles: [BoardRoles.READER] }],
					id: submissionItem.id,
					boardDo: submissionItem,
					rootDo: columnBoard,
				})
			);
			const boardDoAuthorizable = await boardDoAuthorizableService.getBoardAuthorizable(submissionItem);

			await uc.updateSubmissionItem(user.id, submissionItem.id, false);
			const context = { action: Action.write, requiredPermissions: [] };
			expect(authorizationService.checkPermission).toBeCalledWith(user, boardDoAuthorizable, context);
		});
		it('should call service to update submission item', async () => {
			const { submissionItem, user } = setup();
			await uc.updateSubmissionItem(user.id, submissionItem.id, false);
			expect(submissionItemService.update).toHaveBeenCalledWith(submissionItem, false);
		});
	});

	describe('createElement', () => {
		describe('when the user is a student', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submissionItem = submissionItemFactory.build({
					userId: user.id,
				});

				submissionItemService.findById.mockResolvedValue(submissionItem);

				const element = richTextElementFactory.build();

				boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValue(
					new BoardDoAuthorizable({
						users: [{ userId: user.id, roles: [BoardRoles.READER] }],
						id: submissionItem.id,
						boardDo: submissionItem,
						rootDo: columnBoardFactory.build(),
					})
				);

				return { element, submissionItem, user };
			};

			it('should call service to find the submission item ', async () => {
				const { element, submissionItem, user } = setup();
				elementService.create.mockResolvedValueOnce(element);

				await uc.createElement(user.id, submissionItem.id, ContentElementType.RICH_TEXT);
				expect(submissionItemService.findById).toHaveBeenCalledWith(submissionItem.id);
			});

			it('should authorize', async () => {
				const { element, submissionItem, user } = setup();
				elementService.create.mockResolvedValueOnce(element);

				const boardDoAuthorizable = await boardDoAuthorizableService.getBoardAuthorizable(submissionItem);

				await uc.createElement(user.id, submissionItem.id, ContentElementType.RICH_TEXT);
				const context = { action: Action.write, requiredPermissions: [] };
				expect(authorizationService.checkPermission).toBeCalledWith(user, boardDoAuthorizable, context);
			});

			it('should throw if user is not creator of submission item', async () => {
				const user2 = userFactory.buildWithId();
				const { submissionItem } = setup();

				await expect(uc.createElement(user2.id, submissionItem.id, ContentElementType.RICH_TEXT)).rejects.toThrow(
					new ForbiddenException()
				);
			});

			it('should throw if type is not file or rich text', async () => {
				const { submissionItem, user } = setup();
				await expect(uc.createElement(user.id, submissionItem.id, ContentElementType.LINK)).rejects.toThrow(
					new BadRequestException()
				);
			});

			it('should call service to create element', async () => {
				const { element, submissionItem, user } = setup();
				elementService.create.mockResolvedValueOnce(element);

				await uc.createElement(user.id, submissionItem.id, ContentElementType.RICH_TEXT);
				expect(elementService.create).toHaveBeenCalledWith(submissionItem, ContentElementType.RICH_TEXT);
			});

			it('should return element', async () => {
				const { element, submissionItem, user } = setup();
				elementService.create.mockResolvedValueOnce(element);

				const returnedElement = await uc.createElement(user.id, submissionItem.id, ContentElementType.RICH_TEXT);
				expect(returnedElement).toEqual(element);
			});

			it('should throw if element is not file or rich text', async () => {
				const { submissionItem, user } = setup();
				const otherElement = submissionContainerElementFactory.build();
				elementService.create.mockResolvedValueOnce(otherElement);
				await expect(uc.createElement(user.id, submissionItem.id, ContentElementType.RICH_TEXT)).rejects.toThrow(
					new UnprocessableEntityException()
				);
			});
		});
	});
});
