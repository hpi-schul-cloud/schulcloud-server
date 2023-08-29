import { ObjectId } from 'bson';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardDoAuthorizable, BoardRoles, UserRoleEnum } from '@shared/domain';
import {
	fileElementFactory,
	setupEntities,
	submissionContainerElementFactory,
	submissionItemFactory,
	userFactory,
} from '@shared/testing';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { Action } from '@src/modules/authorization/types/action.enum';
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
		boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValue(
			new BoardDoAuthorizable({ users: [], id: new ObjectId().toHexString() })
		);
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
							{ userId: user1.id, roles: [BoardRoles.READER], userRoleEnum: UserRoleEnum.STUDENT },
							{ userId: user2.id, roles: [BoardRoles.READER], userRoleEnum: UserRoleEnum.STUDENT },
						],
						id: submissionContainerEl.id,
					})
				);

				const elementSpy = elementService.findById.mockResolvedValueOnce(submissionContainerEl);

				return { submissionContainerEl, submissionItem1, user1, elementSpy };
			};

			it('student1 should only get their own submission item', async () => {
				const { user1, submissionContainerEl, submissionItem1 } = setup();
				const items = await uc.findSubmissionItems(user1.id, submissionContainerEl.id);
				expect(items.length).toBe(1);
				expect(items[0]).toStrictEqual(submissionItem1);
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
							{ userId: teacher.id, roles: [BoardRoles.EDITOR], userRoleEnum: UserRoleEnum.TEACHER },
							{ userId: student1.id, roles: [BoardRoles.READER], userRoleEnum: UserRoleEnum.STUDENT },
							{ userId: student2.id, roles: [BoardRoles.READER], userRoleEnum: UserRoleEnum.STUDENT },
						],
						id: submissionContainerEl.id,
					})
				);

				const elementSpy = elementService.findById.mockResolvedValue(submissionContainerEl);

				return { submissionContainerEl, submissionItem1, submissionItem2, teacher, elementSpy };
			};

			it('teacher should get all submission items', async () => {
				const { teacher, submissionContainerEl, submissionItem1, submissionItem2 } = setup();
				const items = await uc.findSubmissionItems(teacher.id, submissionContainerEl.id);
				expect(items.length).toBe(2);
				expect(items.map((item) => item.id)).toContain(submissionItem1.id);
				expect(items.map((item) => item.id)).toContain(submissionItem2.id);
			});
		});
		describe('when user has not an authorized role', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submissionItem = submissionItemFactory.build({
					userId: user.id,
				});
				const submissionContainerEl = submissionContainerElementFactory.build({
					children: [submissionItem],
				});

				boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValue(
					new BoardDoAuthorizable({
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						users: [{ userId: user.id, roles: [BoardRoles.READER] }],
						id: submissionContainerEl.id,
					})
				);
				elementService.findById.mockResolvedValueOnce(submissionContainerEl);

				return { user, submissionContainerElement: submissionContainerEl };
			};
			it('should throw forbidden exception', async () => {
				const { user, submissionContainerElement } = setup();

				await expect(uc.findSubmissionItems(user.id, submissionContainerElement.id)).rejects.toThrow(
					'User not part of this board'
				);
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
					'Id does not belong to a submission container'
				);
			});
		});
		describe('when called with invalid submission container children', () => {
			const setup = () => {
				const teacher = userFactory.buildWithId();
				const fileEl = fileElementFactory.build();
				const submissionContainer = submissionContainerElementFactory.build({
					children: [fileEl],
				});
				elementService.findById.mockResolvedValue(submissionContainer);

				return { teacher, submissionContainer };
			};

			it('should throw HttpException', async () => {
				const { teacher, submissionContainer } = setup();

				await expect(uc.findSubmissionItems(teacher.id, submissionContainer.id)).rejects.toThrow(
					'Children of submission-container-element must be of type submission-item'
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

			return { submissionItem, user, boardDoAuthorizableService };
		};

		it('should call service to find the submission item ', async () => {
			const { submissionItem, user } = setup();
			await uc.updateSubmissionItem(user.id, submissionItem.id, false);
			expect(submissionItemService.findById).toHaveBeenCalledWith(submissionItem.id);
		});

		it('should authorize', async () => {
			const { submissionItem, user } = setup();

			boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValue(
				new BoardDoAuthorizable({
					users: [{ userId: user.id, roles: [BoardRoles.READER], userRoleEnum: UserRoleEnum.STUDENT }],
					id: submissionItem.id,
				})
			);
			const boardDoAuthorizable = await boardDoAuthorizableService.getBoardAuthorizable(submissionItem);

			await uc.updateSubmissionItem(user.id, submissionItem.id, false);
			const context = { action: Action.read, requiredPermissions: [] };
			expect(authorizationService.checkPermission).toBeCalledWith(user, boardDoAuthorizable, context);
		});
		it('should throw if user is not creator of submission', async () => {
			const user2 = userFactory.buildWithId();
			const { submissionItem } = setup();

			await expect(uc.updateSubmissionItem(user2.id, submissionItem.id, false)).rejects.toThrow();
		});
		it('should call service to update element', async () => {
			const { submissionItem, user } = setup();
			await uc.updateSubmissionItem(user.id, submissionItem.id, false);
			expect(submissionItemService.update).toHaveBeenCalledWith(submissionItem, false);
		});
	});
});
