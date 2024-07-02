import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { InputFormat } from '@shared/domain/types';
import { setupEntities, userFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { Action } from '@modules/authorization';
import { ElementUc } from './element.uc';
import { BoardNodePermissionService, BoardNodeAuthorizableService, BoardNodeService } from '../service';
import { BoardNodeFactory } from '../domain';

import {
	boardNodeAuthorizableFactory,
	richTextElementFactory,
	drawingElementFactory,
	submissionContainerElementFactory,
	submissionItemFactory,
} from '../testing';
import { RichTextContentBody } from '../controller/dto';

describe(ElementUc.name, () => {
	let module: TestingModule;
	let uc: ElementUc;
	let boardNodeAuthorizableService: DeepMocked<BoardNodeAuthorizableService>;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let boardNodeFactory: DeepMocked<BoardNodeFactory>;
	let boardPermissionService: DeepMocked<BoardNodePermissionService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ElementUc,
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
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
			],
		}).compile();

		uc = module.get(ElementUc);
		boardNodeAuthorizableService = module.get(BoardNodeAuthorizableService);
		boardPermissionService = module.get(BoardNodePermissionService);
		boardNodeService = module.get(BoardNodeService);
		boardNodeFactory = module.get(BoardNodeFactory);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('updateElement', () => {
		describe('when element is rich text', () => {
			const setup = () => {
				const user = userFactory.build();
				const element = richTextElementFactory.build();

				const content: RichTextContentBody = { text: 'this has been updated', inputFormat: InputFormat.RICH_TEXT_CK5 };

				boardNodeService.findContentElementById.mockResolvedValueOnce(element);

				return { element, user, content };
			};

			it('should call service to find the elemebt element', async () => {
				const { element, user, content } = setup();

				await uc.updateElement(user.id, element.id, content);

				expect(boardNodeService.findContentElementById).toHaveBeenCalledWith(element.id);
			});

			it('should call the Board Permission Service to check the user permission', async () => {
				const { user, element, content } = setup();

				await uc.updateElement(user.id, element.id, content);

				expect(boardPermissionService.checkPermission).toHaveBeenCalledWith(user.id, element, Action.write);
			});

			it('should call the boardNodeService service to update content', async () => {
				const { element, user, content } = setup();

				await uc.updateElement(user.id, element.id, content);

				expect(boardNodeService.updateContent).toHaveBeenCalledWith(element, content);
			});

			it('should return the updated element', async () => {
				const { element, user, content } = setup();

				const updatedElement = element;
				updatedElement.text = content.text;
				updatedElement.inputFormat = content.inputFormat;

				const result = await uc.updateElement(user.id, element.id, content);

				expect(result).toBe(updatedElement);
			});
		});
	});

	describe('deleteElement', () => {
		describe('when deleting an element', () => {
			const setup = () => {
				const user = userFactory.build();
				const element = richTextElementFactory.build();

				return { user, element };
			};

			it('should call the service to find the element', async () => {
				const { user, element } = setup();
				boardNodeService.findContentElementById.mockResolvedValueOnce(element);

				await uc.deleteElement(user.id, element.id);

				expect(boardNodeService.findContentElementById).toHaveBeenCalledWith(element.id);
			});

			it('should call the Board Permission Service to check the user permission', async () => {
				const { user, element } = setup();
				boardNodeService.findContentElementById.mockResolvedValueOnce(element);

				await uc.deleteElement(user.id, element.id);

				expect(boardPermissionService.checkPermission).toHaveBeenCalledWith(user.id, element, Action.write);
			});

			it('should call the service to delete the element', async () => {
				const { user, element } = setup();
				boardNodeService.findContentElementById.mockResolvedValueOnce(element);

				await uc.deleteElement(user.id, element.id);

				expect(boardNodeService.delete).toHaveBeenCalledWith(element);
			});
		});
	});

	describe('checkElementReadPermission', () => {
		const setup = () => {
			const user = userFactory.build();
			const drawingElement = drawingElementFactory.build();

			return { drawingElement, user };
		};

		it('should properly find the element', async () => {
			const { drawingElement, user } = setup();
			boardNodeService.findContentElementById.mockResolvedValueOnce(drawingElement);

			await uc.checkElementReadPermission(user.id, drawingElement.id);

			expect(boardNodeService.findContentElementById).toHaveBeenCalledWith(drawingElement.id);
		});

		it('should check the Board Permission Service for user read permission', async () => {
			const { drawingElement, user } = setup();
			boardNodeService.findContentElementById.mockResolvedValueOnce(drawingElement);

			await uc.checkElementReadPermission(user.id, drawingElement.id);

			expect(boardPermissionService.checkPermission).toHaveBeenCalledWith(user.id, drawingElement, Action.read);
		});
	});

	describe('createSubmissionItem', () => {
		describe('with user already has a submission-item in the submission-container-element set', () => {
			const setup = () => {
				const user = userFactory.buildWithId();

				const submissionItem = submissionItemFactory.build({ userId: user.id });
				const submissionContainer = submissionContainerElementFactory.build({ children: [submissionItem] });

				boardNodeService.findByClassAndId.mockResolvedValueOnce(submissionContainer);
				boardPermissionService.isUserBoardEditor.mockReturnValueOnce(false);

				return { submissionContainer, submissionItem, user };
			};

			it('should throw', async () => {
				const { submissionContainer, user } = setup();

				await expect(uc.createSubmissionItem(user.id, submissionContainer.id, true)).rejects.toThrowError(
					'User is not allowed to have multiple submission-items per submission-container-element'
				);
			});
		});

		describe('with user being board editor', () => {
			const sestup = () => {
				const user = userFactory.build();
				const submissionContainer = submissionContainerElementFactory.build();
				boardNodeService.findContentElementById.mockResolvedValueOnce(submissionContainer);
				boardPermissionService.isUserBoardEditor.mockReturnValueOnce(true);

				return { user, submissionContainer };
			};

			it('should throw', async () => {
				const { user, submissionContainer } = sestup();

				await expect(uc.createSubmissionItem(user.id, submissionContainer.id, true)).rejects.toThrowError();
			});
		});

		describe('with user being board reader', () => {
			const setup = () => {
				const user = userFactory.build();
				const submissionItem = submissionItemFactory.build();
				const submissionContainer = submissionContainerElementFactory.build();

				boardNodeService.findByClassAndId.mockResolvedValueOnce(submissionContainer);
				boardPermissionService.isUserBoardEditor.mockReturnValueOnce(false);
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(boardNodeAuthorizableFactory.build());
				boardNodeFactory.buildSubmissionItem.mockReturnValueOnce(submissionItem);

				return { user, submissionContainer, submissionItem };
			};

			it('should call Board Permission Service to check user *read* permission on submission container', async () => {
				const { user, submissionContainer } = setup();

				await uc.createSubmissionItem(user.id, submissionContainer.id, true);

				expect(boardPermissionService.checkPermission).toHaveBeenCalledWith(user.id, submissionContainer, Action.read);
			});

			it('should call BoardNodeAuthorizableService to get board authorizable', async () => {
				const { user, submissionContainer } = setup();

				await uc.createSubmissionItem(user.id, submissionContainer.id, true);

				expect(boardNodeAuthorizableService.getBoardAuthorizable).toHaveBeenCalledWith(submissionContainer);
			});

			it('should call Board Permission Service to check user *editor* permission', async () => {
				const { user, submissionContainer } = setup();
				// boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(boardNodeAuthorizableFactory.build());

				await uc.createSubmissionItem(user.id, submissionContainer.id, true);

				expect(boardPermissionService.isUserBoardEditor).toHaveBeenCalledWith(user.id, expect.anything());
			});

			it('should create submission item', async () => {
				const { user, submissionContainer, submissionItem } = setup();

				await uc.createSubmissionItem(user.id, submissionContainer.id, true);

				expect(boardNodeFactory.buildSubmissionItem).toHaveBeenCalledWith({ completed: true, userId: user.id });
				expect(boardNodeService.addToParent).toHaveBeenCalledWith(submissionContainer, submissionItem);
			});

			it('should return the created submission item', async () => {
				const { user, submissionContainer, submissionItem } = setup();

				boardNodeFactory.buildSubmissionItem.mockReturnValueOnce(submissionItem);

				const result = await uc.createSubmissionItem(user.id, submissionContainer.id, true);

				expect(result).toBe(submissionItem);
			});
		});
	});
});
