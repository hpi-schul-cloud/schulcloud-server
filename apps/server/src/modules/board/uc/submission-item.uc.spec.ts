import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Action } from '@modules/authorization';
import {
	BadRequestException,
	ForbiddenException,
	NotFoundException,
	UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, userFactory } from '@shared/testing/factory';
import { BoardNodeAuthorizable, BoardRoles, ContentElementType, UserWithBoardRoles } from '../domain';
import { BoardNodeAuthorizableService } from '../service/board-node-authorizable.service';
import { BoardNodePermissionService } from '../service/board-node-permission.service';
import {
	columnBoardFactory,
	fileElementFactory,
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
	let elementService: DeepMocked<ContentElementService>;
	let submissionItemService: DeepMocked<SubmissionItemService>;

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
					provide: ContentElementService,
					useValue: createMock<ContentElementService>(),
				},
				{
					provide: SubmissionItemService,
					useValue: createMock<SubmissionItemService>(),
				},
			],
		}).compile();

		uc = module.get(SubmissionItemUc);
		boardNodeAuthorizableService = module.get(BoardNodeAuthorizableService);
		boardPermissionService = module.get(BoardNodePermissionService);
		elementService = module.get(ContentElementService);
		submissionItemService = module.get(SubmissionItemService);
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

				submissionItemService.findById.mockResolvedValueOnce(submissionItem);

				const submissionContainerEl = submissionContainerElementFactory.build({
					children: [submissionItem],
				});

				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					new BoardNodeAuthorizable({
						users: [{ userId: user.id, roles: [BoardRoles.READER] }],
						id: submissionContainerEl.id,
						boardDo: submissionContainerEl,
						rootDo: columnBoardFactory.build(),
					})
				);

				return { submissionContainerEl, submissionItem, user };
			};

			it('should call service to find the submission container ', async () => {
				const { submissionContainerEl, user } = setup();
				elementService.findById.mockResolvedValueOnce(submissionContainerEl);

				await uc.findSubmissionItems(user.id, submissionContainerEl.id);
				expect(elementService.findById).toHaveBeenCalledWith(submissionContainerEl.id);
			});

			it('should throw if element is not a submission container', async () => {
				const { submissionItem, user } = setup();
				const otherElement = richTextElementFactory.build();
				elementService.findById.mockResolvedValueOnce(otherElement);

				await expect(uc.findSubmissionItems(user.id, submissionItem.id)).rejects.toThrow(NotFoundException);
			});

			it('should call Board Permission service to check user permission', async () => {
				const { submissionContainerEl, user } = setup();
				elementService.findById.mockResolvedValueOnce(submissionContainerEl);

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
						boardDo: submissionContainerEl,
						rootDo: columnBoardFactory.build(),
					})
				);

				const elementSpy = elementService.findById.mockResolvedValueOnce(submissionContainerEl);
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

		describe('when called with wrong board node', () => {
			const setup = () => {
				const teacher = userFactory.buildWithId();
				const fileEl = fileElementFactory.build();
				elementService.findById.mockResolvedValueOnce(fileEl);

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

			const submissionItem = submissionItemFactory.build({
				userId: user.id,
			});

			submissionItemService.findById.mockResolvedValueOnce(submissionItem);

			return { submissionItem, user, boardNodeAuthorizableService };
		};

		it('should call service to find the submission item ', async () => {
			const { submissionItem, user } = setup();
			await uc.updateSubmissionItem(user.id, submissionItem.id, false);
			expect(submissionItemService.findById).toHaveBeenCalledWith(submissionItem.id);
		});

		it('should call Board Permission service to check user permission', async () => {
			const { submissionItem, user } = setup();

			await uc.updateSubmissionItem(user.id, submissionItem.id, false);

			expect(boardPermissionService.checkPermission).toBeCalledWith(user.id, submissionItem, Action.write);
		});

		it('should call service to update submission item', async () => {
			const { submissionItem, user } = setup();
			await uc.updateSubmissionItem(user.id, submissionItem.id, false);
			expect(submissionItemService.update).toHaveBeenCalledWith(submissionItem, false);
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

			submissionItemService.findById.mockResolvedValueOnce(submissionItem);

			return { submissionItem, user };
		};

		it('should call service to find the submission item ', async () => {
			const { submissionItem, user } = setup();
			await uc.deleteSubmissionItem(user.id, submissionItem.id);
			expect(submissionItemService.findById).toHaveBeenCalledWith(submissionItem.id);
		});

		it('should call Board Permission service to check user permission', async () => {
			const { submissionItem, user } = setup();

			await uc.deleteSubmissionItem(user.id, submissionItem.id);

			expect(boardPermissionService.checkPermission).toBeCalledWith(user.id, submissionItem, Action.write);
		});

		it('should call service to delete submission item', async () => {
			const { submissionItem, user } = setup();
			await uc.deleteSubmissionItem(user.id, submissionItem.id);
			expect(submissionItemService.delete).toHaveBeenCalledWith(submissionItem);
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

				const users = [{ userId: user.id, roles: [BoardRoles.READER] }];
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					new BoardNodeAuthorizable({
						users,
						id: submissionItem.id,
						boardDo: submissionItem,
						rootDo: columnBoardFactory.build(),
					})
				);

				return { element, submissionItem, user, users };
			};

			it('should throw if type is not file or rich text', async () => {
				const { element, submissionItem, user } = setup();
				submissionItemService.findById.mockResolvedValueOnce(submissionItem);
				elementService.create.mockResolvedValueOnce(element);

				await expect(uc.createElement(user.id, submissionItem.id, ContentElementType.LINK)).rejects.toThrow(
					BadRequestException
				);
			});

			it('should call service to find the submission item ', async () => {
				const { element, submissionItem, user } = setup();
				submissionItemService.findById.mockResolvedValueOnce(submissionItem);
				elementService.create.mockResolvedValueOnce(element);
				boardPermissionService.isUserBoardReader.mockReturnValueOnce(true);
				await uc.createElement(user.id, submissionItem.id, ContentElementType.RICH_TEXT);

				expect(submissionItemService.findById).toHaveBeenCalledWith(submissionItem.id);
			});

			it('should call Board Permission service to check user us a board reader', async () => {
				const { element, submissionItem, user, users } = setup();
				submissionItemService.findById.mockResolvedValueOnce(submissionItem);
				elementService.create.mockResolvedValueOnce(element);
				boardPermissionService.isUserBoardReader.mockReturnValueOnce(true);

				await uc.createElement(user.id, submissionItem.id, ContentElementType.RICH_TEXT);

				expect(boardPermissionService.isUserBoardReader).toBeCalledWith(user.id, users);
			});

			it('should call Board Permission service to check user write permission', async () => {
				const { element, submissionItem, user } = setup();
				submissionItemService.findById.mockResolvedValueOnce(submissionItem);
				elementService.create.mockResolvedValueOnce(element);
				boardPermissionService.isUserBoardReader.mockReturnValueOnce(true);

				await uc.createElement(user.id, submissionItem.id, ContentElementType.RICH_TEXT);

				expect(boardPermissionService.checkPermission).toBeCalledWith(user.id, submissionItem, Action.write);
			});

			it('should call service to create element', async () => {
				const { element, submissionItem, user } = setup();
				submissionItemService.findById.mockResolvedValueOnce(submissionItem);
				elementService.create.mockResolvedValueOnce(element);
				boardPermissionService.isUserBoardReader.mockReturnValueOnce(true);

				await uc.createElement(user.id, submissionItem.id, ContentElementType.RICH_TEXT);

				expect(elementService.create).toHaveBeenCalledWith(submissionItem, ContentElementType.RICH_TEXT);
			});

			it('should return element', async () => {
				const { element, submissionItem, user } = setup();
				submissionItemService.findById.mockResolvedValueOnce(submissionItem);
				elementService.create.mockResolvedValueOnce(element);
				boardPermissionService.isUserBoardReader.mockReturnValueOnce(true);

				const returnedElement = await uc.createElement(user.id, submissionItem.id, ContentElementType.RICH_TEXT);
				expect(returnedElement).toEqual(element);
			});

			it('should throw if returned element is not file or rich text', async () => {
				const { submissionItem, user } = setup();
				submissionItemService.findById.mockResolvedValueOnce(submissionItem);
				boardPermissionService.isUserBoardReader.mockReturnValueOnce(true);

				const otherElement = submissionContainerElementFactory.build();
				elementService.create.mockResolvedValueOnce(otherElement);

				await expect(uc.createElement(user.id, submissionItem.id, ContentElementType.RICH_TEXT)).rejects.toThrow(
					UnprocessableEntityException
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

				submissionItemService.findById.mockResolvedValueOnce(submissionItem);
				boardPermissionService.isUserBoardReader.mockReturnValueOnce(false);

				elementService.create.mockResolvedValueOnce(element);
				const users = [{ userId: user.id, roles: [BoardRoles.READER] }];
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					new BoardNodeAuthorizable({
						users,
						id: submissionItem.id,
						boardDo: submissionItem,
						rootDo: columnBoardFactory.build(),
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
