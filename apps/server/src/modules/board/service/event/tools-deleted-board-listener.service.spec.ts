import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EventService } from '@infra/event';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { externalToolElementFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { ContextExternalToolsDeletedEvent } from '@src/modules/tool';
import { ToolContextType } from '@src/modules/tool/common/enum';
import { ContentElementService } from '../content-element.service';
import { ToolsDeletedBoardListener } from './tools-deleted-board-listener.service';

describe(ToolsDeletedBoardListener.name, () => {
	let module: TestingModule;
	let listener: ToolsDeletedBoardListener;

	let eventService: DeepMocked<EventService>;
	let contentElementService: DeepMocked<ContentElementService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ToolsDeletedBoardListener,
				{
					provide: EventService,
					useValue: createMock<EventService>(),
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
		listener = module.get(ToolsDeletedBoardListener);

		eventService = module.get(EventService);
		contentElementService = module.get(ContentElementService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('constructor', () => {
		it('should register listener', () => {
			expect(eventService.addEventListener).toHaveBeenCalledWith(ContextExternalToolsDeletedEvent, listener);
		});
	});

	describe('handleEvent', () => {
		describe('when event is not a board element', () => {
			const setup = () => {
				const event = new ContextExternalToolsDeletedEvent([
					{
						contextId: 'contextId',
						contextType: ToolContextType.COURSE,
					},
				]);

				return { event };
			};

			it('should not call element service to find element', async () => {
				const { event } = setup();

				await listener.handleEvent(event);

				expect(contentElementService.findByIds).not.toHaveBeenCalled();
			});

			it('should not call element service to delete element', async () => {
				const { event } = setup();

				await listener.handleEvent(event);

				expect(contentElementService.delete).not.toHaveBeenCalled();
			});
		});

		describe('when event is a board element', () => {
			const setup = () => {
				const contextId1 = new ObjectId().toHexString();
				const contextId2 = new ObjectId().toHexString();
				const event = new ContextExternalToolsDeletedEvent([
					{
						contextId: contextId1,
						contextType: ToolContextType.BOARD_ELEMENT,
					},
					{
						contextId: contextId2,
						contextType: ToolContextType.BOARD_ELEMENT,
					},
				]);

				const contentElement1 = externalToolElementFactory.build({ id: contextId1 });
				const contentElement2 = externalToolElementFactory.build({ id: contextId2 });
				contentElementService.findByIds.mockResolvedValueOnce([contentElement1, contentElement2]);

				return { event, contextId1, contextId2, contentElement1, contentElement2 };
			};

			it('should call element service to find elements', async () => {
				const { event, contextId1, contextId2 } = setup();

				await listener.handleEvent(event);

				expect(contentElementService.findByIds).toHaveBeenCalledWith([contextId1, contextId2]);
			});

			it('should call element service to delete element', async () => {
				const { event, contentElement1, contentElement2 } = setup();

				await listener.handleEvent(event);

				expect(contentElementService.delete).toHaveBeenNthCalledWith(1, contentElement1);
				expect(contentElementService.delete).toHaveBeenNthCalledWith(2, contentElement2);
			});
		});
	});
});
