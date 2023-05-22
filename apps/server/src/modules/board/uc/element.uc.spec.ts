import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardDoAuthorizable } from '@shared/domain';
import { fileElementFactory, setupEntities, textElementFactory, userFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { ObjectId } from 'bson';
import { BoardDoAuthorizableService, ContentElementService } from '../service';
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
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		uc = module.get(ElementUc);
		authorizationService = module.get(AuthorizationService);
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
		describe('update text element', () => {
			const setup = () => {
				const user = userFactory.build();
				const textElement = textElementFactory.build();
				const content = { text: 'this has been updated' };

				const elementSpy = elementService.findById.mockResolvedValue(textElement);

				return { textElement, user, content, elementSpy };
			};

			it('should get element', async () => {
				const { textElement, user, content, elementSpy } = setup();

				await uc.updateElementContent(user.id, textElement.id, content);

				expect(elementSpy).toHaveBeenCalledWith(textElement.id);
			});

			it('should call the service', async () => {
				const { textElement, user, content } = setup();

				await uc.updateElementContent(user.id, textElement.id, content);

				expect(elementService.update).toHaveBeenCalledWith(textElement, content);
			});
		});

		describe('update file element', () => {
			const setup = () => {
				const user = userFactory.build();
				const fileElement = fileElementFactory.build();
				const content = { caption: 'this has been updated' };

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
});
