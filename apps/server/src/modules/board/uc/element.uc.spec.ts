import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '@modules/authorization';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardDoAuthorizable, BoardRoles } from '@shared/domain/domainobject';
import { InputFormat } from '@shared/domain/types';
import {
	cardFactory,
	columnBoardFactory,
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
import { boardDoAuthorizableFactory } from '@shared/testing/factory/domainobject/board/board-do-authorizable.factory';
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
		boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValue(boardDoAuthorizableFactory.build());
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

				const elementSpy = elementService.findById.mockResolvedValueOnce(richTextElement);

				return { richTextElement, user, content, elementSpy };
			};

			it('should get element', async () => {
				const { richTextElement, user, content, elementSpy } = setup();

				await uc.updateElement(user.id, richTextElement.id, content);

				expect(elementSpy).toHaveBeenCalledWith(richTextElement.id);
			});

			it('should call the service', async () => {
				const { richTextElement, user, content } = setup();

				await uc.updateElement(user.id, richTextElement.id, content);

				expect(elementService.update).toHaveBeenCalledWith(richTextElement, content);
			});
		});

		describe('update file element', () => {
			const setup = () => {
				const user = userFactory.build();
				const fileElement = fileElementFactory.build();
				const content = { caption: 'this has been updated', alternativeText: 'this altText has been updated' };

				const elementSpy = elementService.findById.mockResolvedValueOnce(fileElement);

				return { fileElement, user, content, elementSpy };
			};

			it('should get element', async () => {
				const { fileElement, user, content, elementSpy } = setup();

				await uc.updateElement(user.id, fileElement.id, content);

				expect(elementSpy).toHaveBeenCalledWith(fileElement.id);
			});

			it('should call the service', async () => {
				const { fileElement, user, content } = setup();

				await uc.updateElement(user.id, fileElement.id, content);

				expect(elementService.update).toHaveBeenCalledWith(fileElement, content);
			});
		});
	});

	describe('deleteElement', () => {
		describe('when deleting a content element', () => {
			const setup = () => {
				const user = userFactory.build();
				const element = richTextElementFactory.build();
				const drawingElement = drawingElementFactory.build();

				boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValue(
					new BoardDoAuthorizable({
						users: [],
						id: new ObjectId().toHexString(),
						boardDo: element,
						rootDo: columnBoardFactory.build(),
					})
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
	});

	describe('checkElementReadPermission', () => {
		const setup = () => {
			const user = userFactory.build();
			const drawingElement = drawingElementFactory.build();
			const card = cardFactory.build({ children: [drawingElement] });
			const columnBoard = columnBoardFactory.build({ children: [card] });
			authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

			const authorizableMock: BoardDoAuthorizable = new BoardDoAuthorizable({
				users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
				id: columnBoard.id,
				boardDo: card,
				rootDo: columnBoard,
			});

			boardDoAuthorizableService.findById.mockResolvedValueOnce(authorizableMock);

			return { drawingElement, user };
		};

		it('should properly find the element', async () => {
			const { drawingElement, user } = setup();
			elementService.findById.mockResolvedValueOnce(drawingElement);

			await uc.checkElementReadPermission(user.id, drawingElement.id);

			expect(elementService.findById).toHaveBeenCalledWith(drawingElement.id);
		});

		it('should properly check element permission and not throw', async () => {
			const { drawingElement, user } = setup();
			elementService.findById.mockResolvedValueOnce(drawingElement);

			await expect(uc.checkElementReadPermission(user.id, drawingElement.id)).resolves.not.toThrow();
		});

		it('should throw at find element by Id', async () => {
			const { drawingElement, user } = setup();
			elementService.findById.mockRejectedValueOnce(new Error());

			await expect(uc.checkElementReadPermission(user.id, drawingElement.id)).rejects.toThrow();
		});

		it('should throw at check permission', async () => {
			const { user } = setup();
			const testElementId = 'wrongTestId123';
			authorizationService.checkPermission.mockImplementationOnce(() => {
				throw new Error();
			});

			await expect(uc.checkElementReadPermission(user.id, testElementId)).rejects.toThrow();
		});
	});
});
