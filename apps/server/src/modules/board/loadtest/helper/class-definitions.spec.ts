import { viewersClass, collaborativeClass, duplicateUserProfiles, createSeveralClasses } from './class-definitions';
import { UserProfileWithAmount, ClassDefinition, Configuration } from '../types';

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
				{ name: 'fastEditor', sleepMs: 1000, isActive: true, amount: 2 },
				{ name: 'slowEditor', sleepMs: 3000, isActive: true, amount: 1 },
				{ name: 'viewer', sleepMs: 1000, isActive: false, amount: 0 },
			];

			const result = duplicateUserProfiles(users);
			expect(result).toEqual([
				{ name: 'fastEditor', sleepMs: 1000, isActive: true },
				{ name: 'fastEditor', sleepMs: 1000, isActive: true },
				{ name: 'slowEditor', sleepMs: 3000, isActive: true },
			]);
		});

		it('should return an empty array if all amounts are zero', () => {
			const users: UserProfileWithAmount[] = [
				{ name: 'fastEditor', sleepMs: 1000, isActive: true, amount: 0 },
				{ name: 'slowEditor', sleepMs: 3000, isActive: true, amount: 0 },
				{ name: 'viewer', sleepMs: 1000, isActive: true, amount: 0 },
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
					{ name: 'fastEditor', sleepMs: 1000, isActive: true, amount: 1 },
					{ name: 'slowEditor', sleepMs: 3000, isActive: true, amount: 1 },
				],
			};

			const configurations: Configuration[] = [
				{
					classDefinition,
					amount: 3,
				},
			];

			const result = createSeveralClasses(configurations);
			expect(result).toEqual([classDefinition, classDefinition, classDefinition]);
		});

		it('should return an empty array if the amount is zero', () => {
			const configurations: Configuration[] = [
				{
					classDefinition: {
						name: 'testClass',
						users: [
							{ name: 'fastEditor', sleepMs: 1000, isActive: true, amount: 1 },
							{ name: 'slowEditor', sleepMs: 3000, isActive: true, amount: 1 },
						],
					},
					amount: 0,
				},
			];

			const result = createSeveralClasses(configurations);
			expect(result).toEqual([]);
		});
	});
});
