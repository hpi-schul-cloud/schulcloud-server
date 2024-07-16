import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Action } from '@modules/authorization';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, userFactory } from '@shared/testing';
import {
	BoardNodeAuthorizable,
	BoardNodeFactory,
	BoardRoles,
	ContentElementType,
	SubmissionContainerElement,
	SubmissionItem,
	UserWithBoardRoles,
} from '../domain';
import { BoardNodeAuthorizableService, BoardNodePermissionService, BoardNodeService } from '../service';
import {
	columnBoardFactory,
	linkElementFactory,
	richTextElementFactory,
	submissionContainerElementFactory,
	submissionItemFactory,
} from '../testing';
import { SubmissionItemUc } from './submission-item.uc';

describe(SubmissionItemUc.name, () => {
	let module: TestingModule;
	let uc: SubmissionItemUc;
	let boardNodeAuthorizableService: DeepMocked<BoardNodeAuthorizableService>;
	let boardPermissionService: DeepMocked<BoardNodePermissionService>;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let boardNodeFactory: DeepMocked<BoardNodeFactory>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SubmissionItemUc,
				{
					provide: BoardNodeAuthorizableService,
					useValue: createMock<BoardNodeAuthorizableService>(),
				},
				{
					provide: BoardNodePermissionService,
					useValue: createMock<BoardNodePermissionService>(),
				},
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
				{
					provide: BoardNodeFactory,
					useValue: createMock<BoardNodeFactory>(),
				},
			],
		}).compile();

		uc = module.get(SubmissionItemUc);
		boardNodeAuthorizableService = module.get(BoardNodeAuthorizableService);
		boardPermissionService = module.get(BoardNodePermissionService);
		boardNodeService = module.get(BoardNodeService);
		boardNodeFactory = module.get(BoardNodeFactory);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('findSubmissionItems', () => {
		describe('when finding submission items', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submissionItem = submissionItemFactory.build({
					userId: user.id,
				});

				const submissionContainerEl = submissionContainerElementFactory.build({
					children: [submissionItem],
				});
				boardNodeService.findByClassAndId.mockResolvedValueOnce(submissionContainerEl);

				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					new BoardNodeAuthorizable({
						users: [{ userId: user.id, roles: [BoardRoles.READER] }],
						id: submissionContainerEl.id,
						boardNode: submissionContainerEl,
						rootNode: columnBoardFactory.build(),
					})
				);

				return { submissionContainerEl, submissionItem, user };
			};

			it('should call service to find the submission container ', async () => {
				const { submissionContainerEl, user } = setup();

				await uc.findSubmissionItems(user.id, submissionContainerEl.id);
				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(
					SubmissionContainerElement,
					submissionContainerEl.id
				);
			});

			it('should call Board Permission service to check user permission', async () => {
				const { submissionContainerEl, user } = setup();

				await uc.findSubmissionItems(user.id, submissionContainerEl.id);
				expect(boardPermissionService.checkPermission).toBeCalledWith(user.id, submissionContainerEl, Action.read);
			});
		});

		describe('when submission container contains several submission items', () => {
			const setup = () => {
				const boardReaderUser1 = userFactory.buildWithId();
				const boardReaderUser2 = userFactory.buildWithId();
				const boardEditorUser = userFactory.buildWithId();

				const submissionItem1 = submissionItemFactory.build({
					userId: boardReaderUser1.id,
				});
				const submissionItem2 = submissionItemFactory.build({
					userId: boardReaderUser2.id,
				});
				const submissionContainerEl = submissionContainerElementFactory.build({
					children: [submissionItem1, submissionItem2],
				});

				const users: UserWithBoardRoles[] = [
					{ userId: boardEditorUser.id, roles: [BoardRoles.EDITOR] },
					{ userId: boardReaderUser1.id, roles: [BoardRoles.READER] },
					{ userId: boardReaderUser2.id, roles: [BoardRoles.READER] },
				];

				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					new BoardNodeAuthorizable({
						users,
						id: submissionContainerEl.id,
						boardNode: submissionContainerEl,
						rootNode: columnBoardFactory.build(),
					})
				);

				const elementSpy = boardNodeService.findByClassAndId.mockResolvedValueOnce(submissionContainerEl);
				return {
					submissionContainerEl,
					submissionItem1,
					submissionItem2,
					boardReaderUser1,
					boardReaderUser2,
					boardEditorUser,
					elementSpy,
				};
			};

			it('board editor should get all submission items', async () => {
				const { boardEditorUser, submissionContainerEl, submissionItem1, submissionItem2 } = setup();
				boardPermissionService.isUserBoardReader.mockReturnValueOnce(false);
				const { submissionItems } = await uc.findSubmissionItems(boardEditorUser.id, submissionContainerEl.id);
				expect(submissionItems.length).toBe(2);
				expect(submissionItems.map((item) => item.id)).toContain(submissionItem1.id);
				expect(submissionItems.map((item) => item.id)).toContain(submissionItem2.id);
			});

			it('board editor gets list of students', async () => {
				const { boardEditorUser, submissionContainerEl } = setup();
				boardPermissionService.isUserBoardReader.mockReturnValueOnce(false);
				const { users } = await uc.findSubmissionItems(boardEditorUser.id, submissionContainerEl.id);
				expect(users.length).toBe(2);
			});

			it('board reader only get his own submission item', async () => {
				const { boardReaderUser1, submissionContainerEl, submissionItem1 } = setup();
				boardPermissionService.isUserBoardReader.mockReturnValueOnce(true);

				const { submissionItems } = await uc.findSubmissionItems(boardReaderUser1.id, submissionContainerEl.id);
				expect(submissionItems.length).toBe(1);
				expect(submissionItems[0]).toStrictEqual(submissionItem1);
			});

			it('board reader not get a list of users', async () => {
				const { boardReaderUser1, submissionContainerEl } = setup();
				boardPermissionService.isUserBoardReader.mockReturnValueOnce(true);
				const { users } = await uc.findSubmissionItems(boardReaderUser1.id, submissionContainerEl.id);
				expect(users.length).toBe(0);
			});
		});
	});

	describe('updateSubmissionItem', () => {
		const setup = () => {
			const user = userFactory.buildWithId();

			const submissionItem = submissionItemFactory.build({
				userId: user.id,
			});

			boardNodeService.findByClassAndId.mockResolvedValueOnce(submissionItem);

			return { submissionItem, user, boardNodeAuthorizableService };
		};

		it('should call service to find the submission item ', async () => {
			const { submissionItem, user } = setup();
			await uc.updateSubmissionItem(user.id, submissionItem.id, false);
			expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(SubmissionItem, submissionItem.id);
		});

		it('should call Board Permission service to check user permission', async () => {
			const { submissionItem, user } = setup();

			await uc.updateSubmissionItem(user.id, submissionItem.id, false);

			expect(boardPermissionService.checkPermission).toBeCalledWith(user.id, submissionItem, Action.write);
		});

		it('should call service to update submission item', async () => {
			const { submissionItem, user } = setup();
			await uc.updateSubmissionItem(user.id, submissionItem.id, false);
			expect(boardNodeService.updateCompleted).toHaveBeenCalledWith(submissionItem, false);
		});

		it('should return updated submission item', async () => {
			const { submissionItem, user } = setup();
			const updatedSubmissionItem = await uc.updateSubmissionItem(user.id, submissionItem.id, false);
			expect(updatedSubmissionItem).toEqual(submissionItem);
		});
	});

	describe('deleteSubmissionItem', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const submissionItem = submissionItemFactory.build({
				userId: user.id,
			});

			boardNodeService.findByClassAndId.mockResolvedValueOnce(submissionItem);

			return { submissionItem, user };
		};

		it('should call service to find the submission item ', async () => {
			const { submissionItem, user } = setup();
			await uc.deleteSubmissionItem(user.id, submissionItem.id);
			expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(SubmissionItem, submissionItem.id);
		});

		it('should call Board Permission service to check user permission', async () => {
			const { submissionItem, user } = setup();

			await uc.deleteSubmissionItem(user.id, submissionItem.id);

			expect(boardPermissionService.checkPermission).toBeCalledWith(user.id, submissionItem, Action.write);
		});

		it('should call service to delete submission item', async () => {
			const { submissionItem, user } = setup();
			await uc.deleteSubmissionItem(user.id, submissionItem.id);
			expect(boardNodeService.delete).toHaveBeenCalledWith(submissionItem);
		});
	});

	describe('createElement', () => {
		describe('when the user is board reader', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submissionItem = submissionItemFactory.build({
					userId: user.id,
				});

				const element = richTextElementFactory.build();

				boardNodeService.findByClassAndId.mockResolvedValueOnce(submissionItem);

				const users = [{ userId: user.id, roles: [BoardRoles.READER] }];
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					new BoardNodeAuthorizable({
						users,
						id: submissionItem.id,
						boardNode: submissionItem,
						rootNode: columnBoardFactory.build(),
					})
				);

				boardPermissionService.isUserBoardReader.mockReturnValueOnce(true);
				boardNodeFactory.buildContentElement.mockReturnValueOnce(element);

				return { element, submissionItem, user, users };
			};

			it('should throw if type is not file or rich text', async () => {
				const { submissionItem, user } = setup();

				await expect(uc.createElement(user.id, submissionItem.id, ContentElementType.LINK)).rejects.toThrow(
					BadRequestException
				);
			});

			it('should call service to find the submission item ', async () => {
				const { submissionItem, user } = setup();

				await uc.createElement(user.id, submissionItem.id, ContentElementType.RICH_TEXT);

				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(SubmissionItem, submissionItem.id);
			});

			it('should call Board Permission service to check user us a board reader', async () => {
				const { submissionItem, user, users } = setup();

				await uc.createElement(user.id, submissionItem.id, ContentElementType.RICH_TEXT);

				expect(boardPermissionService.isUserBoardReader).toBeCalledWith(user.id, users);
			});

			it('should call Board Permission service to check user write permission', async () => {
				const { submissionItem, user } = setup();

				await uc.createElement(user.id, submissionItem.id, ContentElementType.RICH_TEXT);

				expect(boardPermissionService.checkPermission).toBeCalledWith(user.id, submissionItem, Action.write);
			});

			it('should call factory to build content element', async () => {
				const { submissionItem, user } = setup();

				await uc.createElement(user.id, submissionItem.id, ContentElementType.RICH_TEXT);

				expect(boardNodeFactory.buildContentElement).toHaveBeenCalledWith(ContentElementType.RICH_TEXT);
			});

			it('should add element to submission item', async () => {});

			it('should return element', async () => {
				const { element, submissionItem, user } = setup();

				const returnedElement = await uc.createElement(user.id, submissionItem.id, ContentElementType.RICH_TEXT);
				expect(returnedElement).toEqual(element);
			});
		});

		describe('when the factory ', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submissionItem = submissionItemFactory.build({
					userId: user.id,
				});

				boardNodeService.findByClassAndId.mockResolvedValueOnce(submissionItem);
				boardPermissionService.isUserBoardReader.mockReturnValueOnce(false);

				const otherElement = linkElementFactory.build();
				boardNodeFactory.buildContentElement.mockReturnValueOnce(otherElement);
				const users = [{ userId: user.id, roles: [BoardRoles.READER] }];
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					new BoardNodeAuthorizable({
						users,
						id: submissionItem.id,
						boardNode: submissionItem,
						rootNode: columnBoardFactory.build(),
					})
				);

				return { submissionItem, user };
			};

			it('should throw if returned element is not file or rich text', async () => {
				const { submissionItem, user } = setup();

				await expect(uc.createElement(user.id, submissionItem.id, ContentElementType.EXTERNAL_TOOL)).rejects.toThrow(
					BadRequestException
				);
			});
		});

		describe('when the user is not board reader', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submissionItem = submissionItemFactory.build({
					userId: user.id,
				});
				const element = richTextElementFactory.build();

				boardNodeService.findByClassAndId.mockResolvedValueOnce(submissionItem);
				boardPermissionService.isUserBoardReader.mockReturnValueOnce(false);

				boardNodeFactory.buildContentElement.mockReturnValueOnce(element);
				const users = [{ userId: user.id, roles: [BoardRoles.READER] }];
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					new BoardNodeAuthorizable({
						users,
						id: submissionItem.id,
						boardNode: submissionItem,
						rootNode: columnBoardFactory.build(),
					})
				);

				return { element, submissionItem, user };
			};

			it('should throw if boardPermissionService.isUserBoardReader returns false', async () => {
				const { submissionItem, user } = setup();

				await expect(uc.createElement(user.id, submissionItem.id, ContentElementType.RICH_TEXT)).rejects.toThrow(
					new ForbiddenException()
				);
			});
		});
	});
});
