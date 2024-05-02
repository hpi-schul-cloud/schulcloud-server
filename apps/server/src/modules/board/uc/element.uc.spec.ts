import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import type { BoardDoAuthorizable } from '@shared/domain/domainobject';
import { InputFormat } from '@shared/domain/types';
import {
	drawingElementFactory,
	fileElementFactory,
	richTextElementFactory,
	setupEntities,
	submissionContainerElementFactory,
	submissionItemFactory,
	userFactory,
} from '@shared/testing';
import { Logger } from '@src/core/logger';
import { boardDoAuthorizableFactory } from '@shared/testing/factory/domainobject/board/board-do-authorizable.factory';
import { Action } from '@modules/authorization';
import { BoardDoAuthorizableService, ContentElementService, SubmissionItemService } from '../service';
import { ElementUc } from './element.uc';
import { BoardNodePermissionService } from '../poc/service/board-node-permission.service';

describe(ElementUc.name, () => {
	let module: TestingModule;
	let uc: ElementUc;
	let boardDoAuthorizableService: DeepMocked<BoardDoAuthorizableService>;
	let boardPermissionService: DeepMocked<BoardNodePermissionService>;
	let submissionItemService: DeepMocked<SubmissionItemService>;
	let elementService: DeepMocked<ContentElementService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ElementUc,
				{
					provide: BoardDoAuthorizableService,
					useValue: createMock<BoardDoAuthorizableService>(),
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
		boardDoAuthorizableService = module.get(BoardDoAuthorizableService);
		boardPermissionService = module.get(BoardNodePermissionService);
		elementService = module.get(ContentElementService);
		submissionItemService = module.get(SubmissionItemService);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('updateElement', () => {
		describe('when element is rich text', () => {
			const setup = () => {
				const user = userFactory.build();
				const element = richTextElementFactory.build();
				const content = { text: 'this has been updated', inputFormat: InputFormat.RICH_TEXT_CK5 };

				return { element, user, content };
			};

			it('should call service to find the elemebt element', async () => {
				const { element, user, content } = setup();

				await uc.updateElement(user.id, element.id, content);

				expect(elementService.findById).toHaveBeenCalledWith(element.id);
			});

			it('should call the Board Permission Service to check the user permission', async () => {
				const { user, element, content } = setup();
				elementService.findById.mockResolvedValueOnce(element);

				await uc.updateElement(user.id, element.id, content);

				expect(boardPermissionService.checkPermission).toHaveBeenCalledWith(user.id, element, Action.write);
			});

			it('should call the service', async () => {
				const { element, user, content } = setup();

				await uc.updateElement(user.id, element.id, content);

				expect(elementService.update).toHaveBeenCalledWith(element, content);
			});

			it('should return the updated element', async () => {
				const { element, user, content } = setup();
				elementService.findById.mockResolvedValueOnce(element);

				const updatedElement = element;
				updatedElement.text = content.text;
				updatedElement.inputFormat = content.inputFormat;
				elementService.update.mockResolvedValueOnce(updatedElement);

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

				await uc.deleteElement(user.id, element.id);

				expect(elementService.findById).toHaveBeenCalledWith(element.id);
			});

			it('should call the Board Permission Service to check the user permission', async () => {
				const { user, element } = setup();
				elementService.findById.mockResolvedValueOnce(element);

				await uc.deleteElement(user.id, element.id);

				expect(boardPermissionService.checkPermission).toHaveBeenCalledWith(user.id, element, Action.write);
			});

			it('should call the service to delete the element', async () => {
				const { user, element } = setup();
				elementService.findById.mockResolvedValueOnce(element);

				await uc.deleteElement(user.id, element.id);

				expect(elementService.delete).toHaveBeenCalledWith(element);
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
			elementService.findById.mockResolvedValueOnce(drawingElement);

			await uc.checkElementReadPermission(user.id, drawingElement.id);

			expect(elementService.findById).toHaveBeenCalledWith(drawingElement.id);
		});

		it('should check the Board Permission Service for user read permission', async () => {
			const { drawingElement, user } = setup();
			elementService.findById.mockResolvedValueOnce(drawingElement);

			await uc.checkElementReadPermission(user.id, drawingElement.id);

			expect(boardPermissionService.checkPermission).toHaveBeenCalledWith(user.id, drawingElement, Action.read);
		});
	});

	describe('createSubmissionItem', () => {
		describe('with non SubmissionContainerElement parent', () => {
			const setup = () => {
				const user = userFactory.build();
				const fileElement = fileElementFactory.build();

				elementService.findById.mockResolvedValueOnce(fileElement);

				return { fileElement, user };
			};

			it('should throw', async () => {
				const { fileElement, user } = setup();

				await expect(uc.createSubmissionItem(user.id, fileElement.id, true)).rejects.toThrowError(
					'Cannot create submission-item for non submission-container-element'
				);
			});
		});

		describe('with non SubmissionContainerElement containing non SubmissionItem children', () => {
			const setup = () => {
				const user = userFactory.build();
				const fileElement = fileElementFactory.build();

				const submissionContainer = submissionContainerElementFactory.build({ children: [fileElement] });

				elementService.findById.mockResolvedValueOnce(submissionContainer);

				return { submissionContainer, fileElement, user };
			};

			it('should throw', async () => {
				const { submissionContainer, user } = setup();

				await expect(uc.createSubmissionItem(user.id, submissionContainer.id, true)).rejects.toThrowError(
					'Children of submission-container-element must be of type submission-item'
				);
			});
		});

		describe('with user already has a submission-item in the submission-container-element set', () => {
			const setup = () => {
				const user = userFactory.build();

				const submissionItem = submissionItemFactory.build({ userId: user.id });
				const submissionContainer = submissionContainerElementFactory.build({ children: [submissionItem] });

				elementService.findById.mockResolvedValueOnce(submissionContainer);

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
				elementService.findById.mockResolvedValueOnce(submissionContainer);
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
				const submissionContainer = submissionContainerElementFactory.build();
				elementService.findById.mockResolvedValueOnce(submissionContainer);
				boardPermissionService.isUserBoardEditor.mockReturnValueOnce(false);

				const submissionItem = submissionItemFactory.build();

				return { user, submissionContainer, submissionItem };
			};

			it('should call Board Permission Service to check user *read* permission', async () => {
				const { user, submissionContainer } = setup();

				await uc.createSubmissionItem(user.id, submissionContainer.id, true);

				expect(boardPermissionService.checkPermission).toHaveBeenCalledWith(user.id, submissionContainer, Action.read);
			});

			it('should call BoarddoAuthorizableService to get board authorizable', async () => {
				const { user, submissionContainer } = setup();
				boardPermissionService.checkPermission.mockResolvedValueOnce();

				await uc.createSubmissionItem(user.id, submissionContainer.id, true);

				expect(boardDoAuthorizableService.getBoardAuthorizable).toHaveBeenCalledWith(submissionContainer);
			});

			it('should call Board Permission Service to check user *editor* permission', async () => {
				const { user, submissionContainer } = setup();
				boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(boardDoAuthorizableFactory.build());

				await uc.createSubmissionItem(user.id, submissionContainer.id, true);

				expect(boardPermissionService.isUserBoardEditor).toHaveBeenCalledWith(user.id, expect.anything());
			});

			it('should call service to create submission item', async () => {
				const { user, submissionContainer } = setup();

				boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(boardDoAuthorizableFactory.build());
				boardPermissionService.isUserBoardEditor.mockReturnValueOnce(false);

				await uc.createSubmissionItem(user.id, submissionContainer.id, true);

				expect(submissionItemService.create).toHaveBeenCalledWith(user.id, submissionContainer, { completed: true });
			});

			it('should return the created submission item', async () => {
				const user = userFactory.build();
				const submissionContainer = submissionContainerElementFactory.build();
				const submissionItem = submissionItemFactory.build();

				elementService.findById.mockResolvedValueOnce(submissionContainer);
				boardPermissionService.checkPermission.mockResolvedValueOnce();
				boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(boardDoAuthorizableFactory.build());
				submissionItemService.create.mockResolvedValueOnce(submissionItem);

				const result = await uc.createSubmissionItem(user.id, submissionContainer.id, true);

				expect(result).toBe(submissionItem);
			});
		});
	});
});
