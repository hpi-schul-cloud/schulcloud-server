import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { HelpdeskProblem } from '../domain/do';
import { HelpdeskProblemState, HelpdeskProblemType, SupportType } from '../domain/type';

export const helpdeskProblemFactory = BaseFactory.define<HelpdeskProblem, HelpdeskProblem>(HelpdeskProblem, () => {
	return new HelpdeskProblem({
		id: new ObjectId().toHexString(),
		subject: 'Test Problem',
		state: HelpdeskProblemState.OPEN,
		schoolId: new ObjectId().toHexString(),
		userId: new ObjectId().toHexString(),
		order: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
	});
});

export const helpdeskProblemContactAdminFactory = helpdeskProblemFactory.params({
	type: HelpdeskProblemType.CONTACT_ADMIN,
	subject: 'Contact Admin Problem',
});

export const helpdeskProblemSupportFactory = helpdeskProblemFactory.params({
	type: undefined,
	supportType: SupportType.PROBLEM,
	replyEmail: 'user@test.com',
	problemDescription: 'Test problem description',
	browserName: 'Chrome',
	browserVersion: '100.0',
	os: 'Windows 10',
	device: 'Desktop',
});

export const helpdeskProblemWishFactory = helpdeskProblemFactory.params({
	supportType: SupportType.WISH,
	role: 'Teacher',
	desire: 'Better user interface',
	benefit: 'Easier navigation',
	acceptanceCriteria: 'UI should be intuitive',
});
