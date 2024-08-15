import { ClassDefinition, Configuration, UserProfile, UserProfileWithAmount } from '../types';

const fastEditor: UserProfile = { name: 'fastEditor', sleepMs: 1000, maxCards: 10 };
const slowEditor: UserProfile = { name: 'slowEditor', sleepMs: 3000, maxCards: 5 };
const viewer: UserProfile = { name: 'viewer', sleepMs: 1000, maxCards: 0 };

export const viewersClass: ClassDefinition = {
	name: 'viewersClass',
	users: [
		{ ...fastEditor, amount: 30 },
		{ ...slowEditor, amount: 0 },
		// { ...viewer, amount: 0.1 * 30 },
		{ ...viewer, amount: 0 },
	],
};

export const collaborativeClass: ClassDefinition = {
	name: 'collaborativeClass',
	users: [
		{ ...fastEditor, amount: 3 },
		{ ...slowEditor, amount: 27 },
		{ ...viewer, amount: 0 },
	],
};

export const duplicateUserProfiles = (users: UserProfileWithAmount[]) => {
	const expandedUsers: UserProfile[] = [];
	users.forEach(({ amount, ...user }: UserProfileWithAmount) => {
		if (amount > 0) {
			const userProfiles = Array(amount).fill(user) as UserProfile[];
			expandedUsers.push(...userProfiles);
		}
	});
	return expandedUsers;
};

export const createSeveralClasses = (configurations: Configuration[]) =>
	configurations.reduce((all, configuration) => {
		if (configuration.amount > 0) {
			const additionalClasses = Array(configuration.amount).fill(configuration.classDefinition) as ClassDefinition[];
			all = [...all, ...additionalClasses];
		}
		return all;
	}, [] as ClassDefinition[]);
