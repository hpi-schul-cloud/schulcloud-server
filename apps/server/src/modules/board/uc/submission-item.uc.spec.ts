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
		describe('when two students having submission items', () => {
			const setup = () => {
				const user1 = userFactory.buildWithId();
				const user2 = userFactory.buildWithId();
				const submissionItemEl1 = submissionItemFactory.build({
					userId: user1.id,
				});
				const submissionItemEl2 = submissionItemFactory.build({
					userId: user2.id,
				});
				const submissionContainerEl = submissionContainerElementFactory.build({
					children: [submissionItemEl1, submissionItemEl2],
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

				return { submissionContainerEl, submissionItemEl1, user1, elementSpy };
			};

			it('student1 should only get their own submission item', async () => {
				const { user1, submissionContainerEl, submissionItemEl1 } = setup();
				const items = await uc.findSubmissionItems(user1.id, submissionContainerEl.id);
				expect(items.length).toBe(1);
				expect(items[0]).toStrictEqual(submissionItemEl1);
			});
		});
		describe('when teacher of two students', () => {
			const setup = () => {
				const teacher = userFactory.buildWithId();
				const user1 = userFactory.buildWithId();
				const user2 = userFactory.buildWithId();
				const submissionItemEl1 = submissionItemFactory.build({
					userId: user1.id,
				});
				const submissionItemEl2 = submissionItemFactory.build({
					userId: user2.id,
				});
				const submissionContainerEl = submissionContainerElementFactory.build({
					children: [submissionItemEl1, submissionItemEl2],
				});

				boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValue(
					new BoardDoAuthorizable({
						users: [
							{ userId: teacher.id, roles: [BoardRoles.EDITOR], userRoleEnum: UserRoleEnum.TEACHER },
							{ userId: user1.id, roles: [BoardRoles.READER], userRoleEnum: UserRoleEnum.STUDENT },
							{ userId: user2.id, roles: [BoardRoles.READER], userRoleEnum: UserRoleEnum.STUDENT },
						],
						id: submissionContainerEl.id,
					})
				);

				const elementSpy = elementService.findById.mockResolvedValue(submissionContainerEl);

				return { submissionContainerEl, submissionItemEl1, submissionItemEl2, teacher, elementSpy };
			};

			it('teacher should get all submission items', async () => {
				const { teacher, submissionContainerEl, submissionItemEl1, submissionItemEl2 } = setup();
				const items = await uc.findSubmissionItems(teacher.id, submissionContainerEl.id);
				expect(items.length).toBe(2);
				expect(items.map((item) => item.id)).toContain(submissionItemEl1.id);
				expect(items.map((item) => item.id)).toContain(submissionItemEl2.id);
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
