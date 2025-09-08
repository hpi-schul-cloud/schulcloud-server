import { ObjectId } from '@mikro-orm/mongodb';
import { setupEntities } from '@testing/database';
import { RocketChatUserEntity } from './rocket-chat-user.entity';

describe(RocketChatUserEntity.name, () => {
	beforeAll(async () => {
		await setupEntities([RocketChatUserEntity]);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	const setup = () => {
		const props = {
			id: new ObjectId().toHexString(),
			userId: new ObjectId(),
			username: 'Test.User.shls',
			rcId: 'JfMJXua6t29KYXdDc',
			authToken: 'OL8e5YCZHy3agGnLS-gHAx1wU4ZCG8-DXU_WZnUxUu6',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		return { props };
	};

	describe('constructor', () => {
		describe('When constructor is called', () => {
			it('should throw an error by empty constructor', () => {
				// @ts-expect-error: Test case
				const test = () => new RocketChatUserEntity();
				expect(test).toThrow();
			});

			it('should create a rocketChatUser by passing required properties', () => {
				const { props } = setup();
				const entity: RocketChatUserEntity = new RocketChatUserEntity(props);

				expect(entity instanceof RocketChatUserEntity).toEqual(true);
			});

			it(`should return a valid object with fields values set from the provided complete props object`, () => {
				const { props } = setup();
				const entity: RocketChatUserEntity = new RocketChatUserEntity(props);

				const entityProps = {
					id: entity.id,
					userId: entity.userId,
					username: entity.username,
					rcId: entity.rcId,
					authToken: entity.authToken,
					createdAt: entity.createdAt,
					updatedAt: entity.updatedAt,
				};

				expect(entityProps).toEqual(props);
			});
		});
	});
});
