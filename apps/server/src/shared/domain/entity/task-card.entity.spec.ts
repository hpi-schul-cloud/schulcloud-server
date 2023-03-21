import { richTextCardElementFactory, setupEntities, taskCardFactory } from '@shared/testing';
import { CardElementType, RichTextCardElement } from '.';

describe('Task Card Entity', () => {
	beforeAll(async () => {
		await setupEntities();
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
				const richTextCardElement = richTextCardElementFactory.build();
				const taskCard = taskCardFactory.build({ cardElements: [richTextCardElement] });

				const result = taskCard.getCardElements();
				expect(result.length).toEqual(1);

				const resultRichTextCardElement = result[0] as RichTextCardElement;
				expect(resultRichTextCardElement.cardElementType).toEqual(CardElementType.RichText);
				expect(resultRichTextCardElement.value).toEqual(richTextCardElement.value);
			});
		});
	});

	describe('isVisibleBeforeDueDate is called', () => {
		describe('when task card visible at date is before due date', () => {
			it('should return true', () => {
				const taskCard = taskCardFactory.build();

				expect(taskCard.isVisibleBeforeDueDate()).toEqual(true);
			});
		});

		describe('when task card visible at date is after due date', () => {
			it('should return true', () => {
				const tomorrow = new Date(Date.now() + 86400000);
				const inTwoDays = new Date(Date.now() + 172800000);
				const taskCard = taskCardFactory.build({ dueDate: tomorrow, visibleAtDate: inTwoDays });

				expect(taskCard.isVisibleBeforeDueDate()).toEqual(false);
			});
		});
	});
});
