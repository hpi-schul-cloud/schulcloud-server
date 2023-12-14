import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Action, AuthorizationService } from '@modules/authorization';
import { HttpService } from '@nestjs/axios';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardDoAuthorizable } from '@shared/domain/domainobject';
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
import { ObjectId } from 'bson';
import { BoardDoAuthorizableService, ContentElementService, SubmissionItemService } from '../service';
import { ElementUc } from './element.uc';

describe(ElementUc.name, () => {
	let module: TestingModule;
	let uc: ElementUc;
	let authorizationService: DeepMocked<AuthorizationService>;
	let boardDoAuthorizableService: DeepMocked<BoardDoAuthorizableService>;
	let elementService: DeepMocked<ContentElementService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ElementUc,
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

	describe('updateElementContent', () => {
		describe('update rich text element', () => {
			const setup = () => {
				const user = userFactory.build();
				const richTextElement = richTextElementFactory.build();
				const content = { text: 'this has been updated', inputFormat: InputFormat.RICH_TEXT_CK5 };

				const elementSpy = elementService.findById.mockResolvedValue(richTextElement);

				return { richTextElement, user, content, elementSpy };
			};

			it('should get element', async () => {
				const { richTextElement, user, content, elementSpy } = setup();

				await uc.updateElementContent(user.id, richTextElement.id, content);

				expect(elementSpy).toHaveBeenCalledWith(richTextElement.id);
			});

			it('should call the service', async () => {
				const { richTextElement, user, content } = setup();

				await uc.updateElementContent(user.id, richTextElement.id, content);

				expect(elementService.update).toHaveBeenCalledWith(richTextElement, content);
			});
		});

		describe('update file element', () => {
			const setup = () => {
				const user = userFactory.build();
				const fileElement = fileElementFactory.build();
				const content = { caption: 'this has been updated', alternativeText: 'this altText has been updated' };

				const elementSpy = elementService.findById.mockResolvedValue(fileElement);

				return { fileElement, user, content, elementSpy };
			};

			it('should get element', async () => {
				const { fileElement, user, content, elementSpy } = setup();

				await uc.updateElementContent(user.id, fileElement.id, content);

				expect(elementSpy).toHaveBeenCalledWith(fileElement.id);
			});

			it('should call the service', async () => {
				const { fileElement, user, content } = setup();

				await uc.updateElementContent(user.id, fileElement.id, content);

				expect(elementService.update).toHaveBeenCalledWith(fileElement, content);
			});
		});
	});

	describe('deleteElement', () => {
		describe('when deleting an element which has a submission item parent', () => {
			const setup = () => {
				const user = userFactory.build();
				const element = richTextElementFactory.build();
				const submissionItem = submissionItemFactory.build({ userId: user.id });

				boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValue(
					new BoardDoAuthorizable({ users: [], id: new ObjectId().toHexString() })
				);

				elementService.findById.mockResolvedValueOnce(element);
				return { element, user, submissionItem };
			};

			it('should call the service to find the element', async () => {
				const { element, user } = setup();
				await uc.deleteElement(user.id, element.id);

				expect(elementService.findById).toHaveBeenCalledWith(element.id);
			});

			it('should call the service to find the parent of the element', async () => {
				const { element, user } = setup();
				await uc.deleteElement(user.id, element.id);

				expect(elementService.findParentOfId).toHaveBeenCalledWith(element.id);
			});

			it('should throw if the user is not the owner of the submission item', async () => {
				const { element, user } = setup();
				const otherSubmissionItem = submissionItemFactory.build({ userId: new ObjectId().toHexString() });
				elementService.findParentOfId.mockResolvedValueOnce(otherSubmissionItem);

				await expect(uc.deleteElement(user.id, element.id)).rejects.toThrow(new ForbiddenException());
			});

			it('should authorize the user to delete the element', async () => {
				const { element, user, submissionItem } = setup();
				elementService.findParentOfId.mockResolvedValueOnce(submissionItem);
				const boardDoAuthorizable = await boardDoAuthorizableService.getBoardAuthorizable(submissionItem);
				const context = { action: Action.read, requiredPermissions: [] };
				await uc.deleteElement(user.id, element.id);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(user, boardDoAuthorizable, context);
			});

			it('should call the service to delete the element', async () => {
				const { user, element, submissionItem } = setup();
				elementService.findParentOfId.mockResolvedValueOnce(submissionItem);

				await uc.deleteElement(user.id, element.id);

				expect(elementService.delete).toHaveBeenCalledWith(element);
			});
		});

		describe('when deleting a content element', () => {
			const setup = () => {
				const user = userFactory.build();
				const element = richTextElementFactory.build();
				const drawingElement = drawingElementFactory.build();

				boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValue(
					new BoardDoAuthorizable({ users: [], id: new ObjectId().toHexString() })
				);

				return { user, element, drawingElement };
			};

			it('should call the service to find the element', async () => {
				const { user, element } = setup();

				await uc.deleteElement(user.id, element.id);

				expect(elementService.findById).toHaveBeenCalledWith(element.id);
			});

			it('should call the service to delete the element', async () => {
				const { user, element } = setup();
				elementService.findById.mockResolvedValueOnce(element);

				await uc.deleteElement(user.id, element.id);

				expect(elementService.delete).toHaveBeenCalledWith(element);
			});
		});
	});

	describe('createSubmissionItem', () => {
		describe('with non SubmissionContainerElement parent', () => {
			const setup = () => {
				const user = userFactory.build();
				const fileElement = fileElementFactory.build();

				elementService.findById.mockResolvedValue(fileElement);

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

				elementService.findById.mockResolvedValue(submissionContainer);

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

				elementService.findById.mockResolvedValue(submissionContainer);

				return { submissionContainer, submissionItem, user };
			};

			it('should throw', async () => {
				const { submissionContainer, user } = setup();

				await expect(uc.createSubmissionItem(user.id, submissionContainer.id, true)).rejects.toThrowError(
					'User is not allowed to have multiple submission-items per submission-container-element'
				);
			});
		});
	});

	describe('checkElementReadPermission', () => {
		const setup = () => {
			const user = userFactory.build();
			const drawingElement = drawingElementFactory.build();

			return { drawingElement, user };
		};

		it('should execute properly', async () => {
			const { drawingElement, user } = setup();
			elementService.findById.mockResolvedValue(drawingElement);

			await uc.checkElementReadPermission(user.id, drawingElement.id);

			expect(elementService.findById).toHaveBeenCalledWith(drawingElement.id);
		});

		it('should throw at find element by Id', async () => {
			const { drawingElement, user } = setup();
			elementService.findById.mockRejectedValue(new Error());

			await expect(uc.checkElementReadPermission(user.id, drawingElement.id)).rejects.toThrow();
		});

		it('should throw at check permission', async () => {
			const { drawingElement, user } = setup();
			authorizationService.hasPermission.mockReturnValueOnce(false);

			await expect(uc.checkElementReadPermission(user.id, drawingElement.id)).rejects.toThrow();
		});
	});
});
