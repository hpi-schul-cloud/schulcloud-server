import { ObjectId } from 'bson';
import { UserIdAndExternalIdBuilder } from './userIdandExternalId.builder';

describe(UserIdAndExternalIdBuilder.name, () => {
	afterAll(() => {
		jest.clearAllMocks();
	});

	const setup = () => {
		const userId = new ObjectId().toHexString();
		const externalId = new ObjectId().toHexString();

		return { userId, externalId };
	};

	it('should build generic userIdAndExternalId with all attributes', () => {
		const { userId, externalId } = setup();

		const result = UserIdAndExternalIdBuilder.build(userId, externalId);

		expect(result.userId).toEqual(userId);
		expect(result.externalId).toEqual(externalId);
	});
});
