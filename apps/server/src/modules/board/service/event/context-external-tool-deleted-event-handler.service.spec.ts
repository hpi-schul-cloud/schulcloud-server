import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalToolDeletedEvent } from '../../../tool/context-external-tool/domain';
import { ContentElementType, DeletedElement, ROOT_PATH } from '../../domain';
import { externalToolElementFactory } from '../../testing';
import { BoardNodeService } from '../board-node.service';
import { ContextExternalToolDeletedEventHandlerService } from './context-external-tool-deleted-event-handler.service';

describe(ContextExternalToolDeletedEventHandlerService.name, () => {
	let module: TestingModule;
	let service: ContextExternalToolDeletedEventHandlerService;

	let boardNodeService: DeepMocked<BoardNodeService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ContextExternalToolDeletedEventHandlerService,
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
			],
		}).compile();

		service = module.get(ContextExternalToolDeletedEventHandlerService);
		boardNodeService = module.get(BoardNodeService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('handle', () => {
		describe('when a context external tool gets deleted', () => {
			const setup = () => {
				const contextExternalToolId = new ObjectId().toHexString();
				const event = new ContextExternalToolDeletedEvent({
					id: contextExternalToolId,
					title: 'Delete me',
					description: 'description',
				});
				const externalToolElement = externalToolElementFactory.build({
					contextExternalToolId,
				});

				boardNodeService.findElementsByContextExternalToolId.mockResolvedValueOnce([externalToolElement]);

				return {
					event,
					externalToolElement,
				};
			};

			it('should replace the context external tool element with a deleted element', async () => {
				const { event, externalToolElement } = setup();

				await service.handle(event);

				expect(boardNodeService.replace).toHaveBeenCalledWith(
					externalToolElement,
					new DeletedElement({
						id: expect.any(String),
						path: ROOT_PATH,
						level: 0,
						position: 0,
						children: [],
						createdAt: expect.any(Date) as unknown as Date,
						updatedAt: expect.any(Date) as unknown as Date,
						deletedElementType: ContentElementType.EXTERNAL_TOOL,
						title: event.title,
						description: 'description',
					})
				);
			});
		});
	});
});
