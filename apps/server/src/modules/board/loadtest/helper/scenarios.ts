import { ClassDefinition, UserProfile } from '../types';

const fastEditor: UserProfile = { name: 'fastEditor', sleepMs: 1000, maxCards: 10 };
const slowEditor: UserProfile = { name: 'slowEditor', sleepMs: 3000, maxCards: 5 };
const viewer: UserProfile = { name: 'viewer', sleepMs: 1000, maxCards: 0 };

export const viewersClass: ClassDefinition = {
	name: 'viewersClass',
	users: [
		{ ...fastEditor, amount: 1 },
		{ ...slowEditor, amount: 0 },
		{ ...viewer, amount: 1 },
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

export const expandUserProfiles = (users: UserProfile[]) => {
	const expandedUsers: UserProfile[] = [];
	users.forEach(({ amount, ...user }: UserProfile) => {
		if (amount !== undefined && amount > 0) {
			const userProfiles = Array(amount).fill(user) as UserProfile[];
			expandedUsers.push(...userProfiles);
		}
	});
	return expandedUsers;
};

export const createSeveralClasses = (amount: number, classDefinition: ClassDefinition) =>
	Array(amount).fill(classDefinition) as ClassDefinition[];
