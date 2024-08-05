import { viewersClass, collaborativeClass, duplicateUserProfiles, createSeveralClasses } from './classDefinitions';
import { UserProfileWithAmount, ClassDefinition } from '../types';

describe('classDefintions', () => {
	describe('viewersClass', () => {
		it('should have the correct structure and values', () => {
			expect(viewersClass).toEqual(
				expect.objectContaining({
					name: 'viewersClass',
				})
			);
			const viewers = viewersClass.users.find((user) => user.name === 'viewer');
			expect(viewers).toBeDefined();
		});
	});

	describe('collaborativeClass', () => {
		it('should have the correct structure and values', () => {
			expect(collaborativeClass).toEqual(
				expect.objectContaining({
					name: 'collaborativeClass',
				})
			);
			const editorCount = collaborativeClass.users
				.filter((user) => ['fastEditor', 'slowEditor'].includes(user.name))
				.map((user) => user.amount)
				.reduce((sum, current) => sum + current, 0);
			expect(editorCount).toBeGreaterThanOrEqual(30);
		});
	});

	describe('duplicateUserProfiles', () => {
		it('should correctly duplicate user profiles based on the amount property', () => {
			const users: UserProfileWithAmount[] = [
				{ name: 'fastEditor', sleepMs: 1000, maxCards: 10, amount: 2 },
				{ name: 'slowEditor', sleepMs: 3000, maxCards: 5, amount: 1 },
				{ name: 'viewer', sleepMs: 1000, maxCards: 0, amount: 0 },
			];

			const result = duplicateUserProfiles(users);
			expect(result).toEqual([
				{ name: 'fastEditor', sleepMs: 1000, maxCards: 10 },
				{ name: 'fastEditor', sleepMs: 1000, maxCards: 10 },
				{ name: 'slowEditor', sleepMs: 3000, maxCards: 5 },
			]);
		});

		it('should return an empty array if all amounts are zero', () => {
			const users: UserProfileWithAmount[] = [
				{ name: 'fastEditor', sleepMs: 1000, maxCards: 10, amount: 0 },
				{ name: 'slowEditor', sleepMs: 3000, maxCards: 5, amount: 0 },
				{ name: 'viewer', sleepMs: 1000, maxCards: 0, amount: 0 },
			];

			const result = duplicateUserProfiles(users);
			expect(result).toEqual([]);
		});
	});

	describe('createSeveralClasses', () => {
		it('should correctly create multiple instances of a class definition', () => {
			const classDefinition: ClassDefinition = {
				name: 'testClass',
				users: [
					{ name: 'fastEditor', sleepMs: 1000, maxCards: 10, amount: 1 },
					{ name: 'slowEditor', sleepMs: 3000, maxCards: 5, amount: 1 },
				],
			};

			const result = createSeveralClasses(3, classDefinition);
			expect(result).toEqual([classDefinition, classDefinition, classDefinition]);
		});

		it('should return an empty array if the amount is zero', () => {
			const classDefinition: ClassDefinition = {
				name: 'testClass',
				users: [
					{ name: 'fastEditor', sleepMs: 1000, maxCards: 10, amount: 1 },
					{ name: 'slowEditor', sleepMs: 3000, maxCards: 5, amount: 1 },
				],
			};

			const result = createSeveralClasses(0, classDefinition);
			expect(result).toEqual([]);
		});
	});
});
