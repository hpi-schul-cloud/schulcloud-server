import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { InputFormat } from '@shared/domain';
import { fileElementFactory, richTextElementFactory, setupEntities, userFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { ContentElementService } from '../service';
import { ElementUc } from './element.uc';

describe(ElementUc.name, () => {
	let module: TestingModule;
	let uc: ElementUc;
	let elementService: DeepMocked<ContentElementService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ElementUc,
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
		elementService = module.get(ContentElementService);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('updateElementContent', () => {
		describe('update richtext element', () => {
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
