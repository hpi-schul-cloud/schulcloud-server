import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardDoAuthorizable, BoardRoles, UserRoleEnum } from '@shared/domain';
import { setupEntities, submissionContainerElementFactory, submissionItemFactory, userFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { ObjectId } from 'bson';
import { BoardDoAuthorizableService, ContentElementService } from '../service';
import { SubmissionItemUc } from './submission-item.uc';

describe(SubmissionItemUc.name, () => {
	let module: TestingModule;
	let uc: SubmissionItemUc;
	let authorizationService: DeepMocked<AuthorizationService>;
	let boardDoAuthorizableService: DeepMocked<BoardDoAuthorizableService>;
	let elementService: DeepMocked<ContentElementService>;

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
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findSubmissionItems', () => {
		describe('with two students having submission items', () => {
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

				const elementSpy = elementService.findById.mockResolvedValue(submissionContainerEl);

				return { submissionContainerEl, submissionItemEl1, user1, elementSpy };
			};

			it('student1 should only get their own submission item', async () => {
				const { user1, submissionContainerEl, submissionItemEl1 } = setup();
				const items = await uc.findSubmissionItems(user1.id, submissionContainerEl.id);
				expect(items.length).toBe(1);
				expect(items[0]).toStrictEqual(submissionItemEl1);
			});
		});
		describe('with teacher of two students', () => {
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
	});
});
