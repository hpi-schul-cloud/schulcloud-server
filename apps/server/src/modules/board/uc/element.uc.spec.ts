import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { cardFactory, fileElementFactory, setupEntities, textElementFactory, userFactory } from '@shared/testing';
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

			it('should update element', async () => {
				const { textElement, user, content } = setup();

				await uc.updateElementContent(user.id, textElement.id, content);

				expect(textElement.text).toEqual(content.text);
			});

			it('should persist element', async () => {
				const { textElement, user, content } = setup();

				await uc.updateElementContent(user.id, textElement.id, content);

				expect(elementService.update).toHaveBeenCalledWith(textElement);
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

			it('should update element', async () => {
				const { fileElement, user, content } = setup();

				await uc.updateElementContent(user.id, fileElement.id, content);

				expect(fileElement.caption).toEqual(content.caption);
			});

			it('should persist element', async () => {
				const { fileElement, user, content } = setup();

				await uc.updateElementContent(user.id, fileElement.id, content);

				expect(elementService.update).toHaveBeenCalledWith(fileElement);
			});
		});

		describe('update unknown element', () => {
			const setup = () => {
				const user = userFactory.build();
				const notAnElement = cardFactory.build();
				const content = { text: 'this has been updated' };

				// @ts-expect-error Testcase
				const elementSpy = elementService.findById.mockResolvedValue(notAnElement);

				return { notAnElement, user, content, elementSpy };
			};

			it('should throw', async () => {
				const { notAnElement, user, content } = setup();

				const call = () => uc.updateElementContent(user.id, notAnElement.id, content);

				await expect(call).rejects.toThrow();
			});
		});
	});
});
