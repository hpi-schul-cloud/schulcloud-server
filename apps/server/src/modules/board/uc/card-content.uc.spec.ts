// card-content.uc.spec.ts
import { CardContentUc } from './card-content.uc';
import { BoardNodePermissionService, BoardNodeService } from '../service';
import { BoardNodeFactory, Column } from '../domain';
import { ContentElementType } from '../domain/types';
import {
	DrawingContentBody,
	ExternalToolContentBody,
	FileContentBody,
	FileFolderContentBody,
	H5pContentBody,
	LinkContentBody,
	RichTextContentBody,
	SubmissionContainerContentBody,
	UpdateElementContentBodyParams,
	VideoConferenceContentBody,
} from '../controller/dto';
import { EntityId } from '@shared/domain/types';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker/.';
import { LegacyLogger } from '@core/logger';

describe(CardContentUc.name, () => {
	let cardContentUc: CardContentUc;
	let module: TestingModule;
	let boardNodePermissionService: DeepMocked<BoardNodePermissionService>;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let boardNodeFactory: DeepMocked<BoardNodeFactory>;

	beforeAll(async () => {
		// Initialize mocks before using them
		boardNodePermissionService = {} as DeepMocked<BoardNodePermissionService>;
		boardNodeService = {} as DeepMocked<BoardNodeService>;
		boardNodeFactory = {} as DeepMocked<BoardNodeFactory>;

		module = await Test.createTestingModule({
			providers: [
				CardContentUc,
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
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		cardContentUc = module.get(CardContentUc);
		boardNodePermissionService = module.get(BoardNodePermissionService);
		boardNodeService = module.get(BoardNodeService);
		boardNodeFactory = module.get(BoardNodeFactory);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('createCardWithContent', () => {
		describe('Create card with content available', () => {
			const setup = () => {
				const userId = 'user-1' as EntityId;
				const columnId = 'col-1' as EntityId;
				const column = { id: columnId } as unknown as Column;
				const due = new Date('2025-01-01T00:00:00.000Z');

				const props: UpdateElementContentBodyParams[] = [
					{
						data: {
							type: ContentElementType.RICH_TEXT,
							content: { text: 'Hello', inputFormat: 'plainText' } as RichTextContentBody,
						},
					},
					{
						data: {
							type: ContentElementType.LINK,
							content: {
								url: faker.internet.url(),
								title: faker.lorem.sentence(),
								description: faker.lorem.sentence(),
								imageUrl: faker.lorem.sentence(),
								originalImageUrl: faker.lorem.sentence(),
							} as LinkContentBody,
						},
					},
					{
						data: {
							type: ContentElementType.FILE,
							content: { caption: 'Cap', alternativeText: 'Alt', fileId: faker.string.uuid() } as FileContentBody,
						},
					},
					{
						data: {
							type: ContentElementType.DRAWING,
							content: { description: 'Sketch', drawingId: faker.string.uuid() } as DrawingContentBody,
						},
					},
					{
						data: {
							type: ContentElementType.FILE_FOLDER,
							content: { title: 'Folder A', folderId: faker.string.uuid() } as FileFolderContentBody,
						},
					},
					{
						data: {
							type: ContentElementType.SUBMISSION_CONTAINER,
							content: { dueDate: due } as SubmissionContainerContentBody,
						},
					},
					{
						data: {
							type: ContentElementType.VIDEO_CONFERENCE,
							content: { title: 'Standup' } as VideoConferenceContentBody,
						},
					},
					{
						data: {
							type: ContentElementType.EXTERNAL_TOOL,
							content: { contextExternalToolId: faker.string.uuid() } as ExternalToolContentBody,
						},
					},
					{
						data: {
							type: ContentElementType.H5P,
							content: { contentId: faker.string.uuid() } as H5pContentBody,
						},
					},
				];
				jest.spyOn(boardNodeService, 'findByClassAndId').mockResolvedValue(column);
				jest.spyOn(boardNodePermissionService, 'checkPermission').mockResolvedValue(undefined);

				// Mock buildCard to return an object with children as an array
				boardNodeFactory.buildCard = jest.fn().mockReturnValue({
					id: faker.string.uuid(),
					children: [], // Ensure children is an array
				});

				return { userId, columnId, column, props };
			};

			it('calls boardNodeService.findByClassAndId and .addToParent', async () => {
				const { userId, columnId, props } = setup();
				await cardContentUc.createCardWithContent(userId, columnId, props, 'Card Title');
				expect(boardNodeService.findByClassAndId).toHaveBeenCalled();
				expect(boardNodeService.addToParent).toHaveBeenCalled();
			});
		});
	});

	describe('permission denied', () => {
		it('throws and aborts creation', async () => {
			const userId = 'user-1' as EntityId;
			const columnId = 'col-1' as EntityId;
			const column = { id: columnId } as Column;

			jest.spyOn(boardNodeService, 'findByClassAndId').mockImplementation().mockResolvedValue(column);
			jest
				.spyOn(boardNodePermissionService, 'checkPermission')
				.mockImplementation()
				.mockRejectedValue(new Error('forbidden'));

			await expect(cardContentUc.createCardWithContent(userId, columnId, [], 'Nope')).rejects.toThrow('forbidden');

			expect(boardNodeFactory.buildContentElement).not.toHaveBeenCalled();
			expect(boardNodeFactory.buildCard).not.toHaveBeenCalled();
			expect(boardNodeService.addToParent).not.toHaveBeenCalled();
		});
	});
});
