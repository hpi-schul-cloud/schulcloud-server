import { MikroORM } from '@mikro-orm/core';
import { richTextCardElementFactory, setupEntities, taskCardFactory, titleCardElementFactory } from '@shared/testing';
import { CardElementType, RichTextCardElement, TitleCardElement } from '.';

describe('Task Card Entity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('getCardElements is called', () => {
		describe('when task card has no card elements', () => {
			it('should return an empty array', () => {
				const taskCard = taskCardFactory.build();

				expect(taskCard.getCardElements()).toEqual([]);
			});
		});

		describe('when task card has several card elements', () => {
			it('should return the correct card elements', () => {
				const titleCardElement = titleCardElementFactory.build();
				const richTextCardElement = richTextCardElementFactory.build();
				const taskCard = taskCardFactory.build({ cardElements: [titleCardElement, richTextCardElement] });

				const result = taskCard.getCardElements();
				expect(result.length).toEqual(2);

				const resultTitleCardElement = result[0] as TitleCardElement;
				expect(resultTitleCardElement.cardElementType).toEqual(CardElementType.Title);
				expect(resultTitleCardElement.value).toEqual(titleCardElement.value);

				const resultRichTextCardElement = result[1] as RichTextCardElement;
				expect(resultRichTextCardElement.cardElementType).toEqual(CardElementType.RichText);
				expect(resultRichTextCardElement.value).toEqual(richTextCardElement.value);
			});
		});
	});

	describe('pastCompletionDate is called', () => {
		describe('when task card has no completion date', () => {
			it('should return false', () => {
				const taskCard = taskCardFactory.build();

				expect(taskCard.pastCompletionDate()).toEqual(false);
			});
		});

		describe('when task card has completion date in the past', () => {
			it('should return true', () => {
				const yesterday = new Date(Date.now() - 86400000);
				const taskCard = taskCardFactory.build({ completionDate: yesterday });

				expect(taskCard.pastCompletionDate()).toEqual(true);
			});
		});

		describe('when task card has valid completion date in the future', () => {
			it('should return true', () => {
				const taskCard = taskCardFactory.dueInOneDay().build();

				expect(taskCard.pastCompletionDate()).toEqual(false);
			});
		});
	});
});
