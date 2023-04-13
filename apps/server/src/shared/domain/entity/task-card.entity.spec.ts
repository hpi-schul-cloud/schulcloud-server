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
	/* 
	describe('completeForUser is called', () => {
		it('should add the user to the completed collection', () => {
			const user = userFactory.buildWithId();
			const taskCard = taskCardFactory.buildWithId();

			taskCard.completeForUser(user);

			expect(taskCard.completed.contains(user)).toBe(true);
		});

		it('should make sure the user is added only once', () => {
			const user = userFactory.buildWithId();
			const taskCard = taskCardFactory.buildWithId();

			taskCard.completeForUser(user);
			taskCard.completeForUser(user);

			expect(taskCard.completed.count()).toBe(1);
		});

		it('should not overwrite other users in the completed collection', () => {
			const user1 = userFactory.buildWithId();
			const user2 = userFactory.buildWithId();
			const taskCard = taskCardFactory.buildWithId({ completed: [user1] });

			taskCard.completeForUser(user2);

			expect(taskCard.completed.contains(user1)).toBe(true);
			expect(taskCard.completed.contains(user2)).toBe(true);
		});
	});

	describe('undoForUser is called', () => {
		it('should remove the user from the completed collection', () => {
			const user = userFactory.buildWithId();
			const taskCard = taskCardFactory.buildWithId({ completed: [user] });

			taskCard.undoForUser(user);

			expect(taskCard.completed.contains(user)).toBe(false);
		});

		it('should make sure the beta task can be undone even if already done', () => {
			const user = userFactory.buildWithId();
			const taskCard = taskCardFactory.buildWithId();

			taskCard.undoForUser(user);
			taskCard.undoForUser(user);

			expect(taskCard.completed.count()).toBe(0);
		});

		it('should not remove other users from the completed collection', () => {
			const user1 = userFactory.buildWithId();
			const user2 = userFactory.buildWithId();
			const taskCard = taskCardFactory.buildWithId({ completed: [user1, user2] });

			taskCard.undoForUser(user2);

			expect(taskCard.completed.contains(user1)).toBe(true);
			expect(taskCard.completed.contains(user2)).toBe(false);
		});
	});

	describe('isCompletedForUser is called', () => {
		describe('when user completed the beta task', () => {
			it('should return true', () => {
				const user = userFactory.buildWithId();
				const taskCard = taskCardFactory.buildWithId({ completed: [user] });

				const result = taskCard.isCompletedForUser(user);

				expect(result).toEqual(true);
			});
		});

		describe('when user not yet completed the beta task', () => {
			it('should return false', () => {
				const user = userFactory.buildWithId();
				const taskCard = taskCardFactory.buildWithId({ completed: [] });

				const result = taskCard.isCompletedForUser(user);

				expect(result).toEqual(false);
			});
		});

		describe('when other users have completed the beta task but the user did not', () => {
			it('should return false', () => {
				const user1 = userFactory.buildWithId();
				const user2 = userFactory.buildWithId();
				const taskCard = taskCardFactory.buildWithId({ completed: [user1] });

				const result = taskCard.isCompletedForUser(user2);

				expect(result).toEqual(false);
			});
		});
	}); */
});
