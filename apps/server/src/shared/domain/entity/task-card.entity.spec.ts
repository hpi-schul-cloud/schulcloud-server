import { richTextCardElementFactory, setupEntities, taskCardFactory, userFactory } from '@shared/testing';
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

	describe('addUserToCompletedList is called', () => {
		it('should add the user to the completed users list', () => {
			const user = userFactory.buildWithId();
			const taskCard = taskCardFactory.buildWithId();

			taskCard.addUserToCompletedList(user);

			expect(taskCard.completedUsers.contains(user)).toBe(true);
		});

		it('should make sure the user is added only once', () => {
			const user = userFactory.buildWithId();
			const taskCard = taskCardFactory.buildWithId();

			taskCard.addUserToCompletedList(user);
			taskCard.addUserToCompletedList(user);

			expect(taskCard.completedUsers.count()).toBe(1);
		});

		it('should not overwrite other users in the completed users list', () => {
			const user1 = userFactory.buildWithId();
			const user2 = userFactory.buildWithId();
			const taskCard = taskCardFactory.buildWithId({ completedUsers: [user1] });

			taskCard.addUserToCompletedList(user2);

			expect(taskCard.completedUsers.contains(user1)).toBe(true);
			expect(taskCard.completedUsers.contains(user2)).toBe(true);
		});
	});

	describe('removeUserFromCompletedList is called', () => {
		it('should remove the user from the completed users list', () => {
			const user = userFactory.buildWithId();
			const taskCard = taskCardFactory.buildWithId({ completedUsers: [user] });

			taskCard.removeUserFromCompletedList(user);

			expect(taskCard.completedUsers.contains(user)).toBe(false);
		});

		it('should make sure the beta task can be marked as uncompleted even if already done', () => {
			const user = userFactory.buildWithId();
			const taskCard = taskCardFactory.buildWithId();

			taskCard.removeUserFromCompletedList(user);
			taskCard.removeUserFromCompletedList(user);

			expect(taskCard.completedUsers.count()).toBe(0);
		});

		it('should not remove other users from the completed users list', () => {
			const user1 = userFactory.buildWithId();
			const user2 = userFactory.buildWithId();
			const taskCard = taskCardFactory.buildWithId({ completedUsers: [user1, user2] });

			taskCard.removeUserFromCompletedList(user2);

			expect(taskCard.completedUsers.contains(user1)).toBe(true);
			expect(taskCard.completedUsers.contains(user2)).toBe(false);
		});
	});

	describe('getCompletedUserIds is called', () => {
		it('should return list of IDs for completed users', () => {
			const user = userFactory.buildWithId();
			const taskCard = taskCardFactory.buildWithId({ completedUsers: [user] });

			const result = taskCard.getCompletedUserIds();

			const expectedUserIds = [user.id];
			expect(result).toEqual(expectedUserIds);
		});
		it('should return empty list if nobody completed yet', () => {
			const taskCard = taskCardFactory.buildWithId({ completedUsers: [] });

			const result = taskCard.getCompletedUserIds();

			expect(result).toEqual([]);
		});
	});
});
