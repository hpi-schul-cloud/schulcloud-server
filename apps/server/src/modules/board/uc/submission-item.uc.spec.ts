import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardDoAuthorizable } from '@shared/domain';
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
				const user1 = userFactory.build();
				const user2 = userFactory.build();
				const submissionItemEl1 = submissionItemFactory.build({
					userId: user1.id,
				});
				const submissionItemEl2 = submissionItemFactory.build({
					userId: user2.id,
				});
				const submissionContainerEl = submissionContainerElementFactory.build({
					children: [submissionItemEl1, submissionItemEl2],
				});

				const elementSpy = elementService.findById.mockResolvedValue(submissionContainerEl);

				return { submissionContainerEl, submissionItemEl1, user1, elementSpy };
			};

			it('student1 only gets their own submission item', async () => {
				const { user1, submissionContainerEl, submissionItemEl1 } = setup();
				const items = await uc.findSubmissionItems(user1.id, submissionContainerEl.id);
				expect(items.length).toBe(1);
				expect(items[0]).toStrictEqual(submissionItemEl1);
			});
		});
	});
});
