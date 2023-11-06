import { ObjectId } from '@mikro-orm/mongodb';
import { RocketChatUser } from './rocket-chat-user.do';
import { rocketChatUserFactory } from './testing/rocket-chat-user.factory';

describe(RocketChatUser.name, () => {
	describe('constructor', () => {
		describe('When constructor is called', () => {
			it('should create a rocketChatUser by passing required properties', () => {
				const domainObject: RocketChatUser = rocketChatUserFactory.build();

				expect(domainObject instanceof RocketChatUser).toEqual(true);
			});
		});

		describe('when passed a valid id', () => {
			const setup = () => {
				const domainObject: RocketChatUser = rocketChatUserFactory.build();

				return { domainObject };
			};

			it('should set the id', () => {
				const { domainObject } = setup();

				const rocketChatUserObject: RocketChatUser = new RocketChatUser(domainObject);

				expect(rocketChatUserObject.id).toEqual(domainObject.id);
			});
		});
	});

	describe('getters', () => {
		describe('When getters are used', () => {
			const setup = () => {
				const props = {
					id: new ObjectId().toHexString(),
					userId: new ObjectId().toHexString(),
					username: 'Test.User.shls',
					rcId: 'JfMJXua6t29KYXdDc',
					authToken: 'OL8e5YCZHy3agGnLS-gHAx1wU4ZCG8-DXU_WZnUxUu6',
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				const rocketChatUserDo = new RocketChatUser(props);

				return { props, rocketChatUserDo };
			};

			it('getters should return proper values', () => {
				const { props, rocketChatUserDo } = setup();

				const gettersValues = {
					id: rocketChatUserDo.id,
					userId: rocketChatUserDo.userId,
					username: rocketChatUserDo.username,
					rcId: rocketChatUserDo.rcId,
					authToken: rocketChatUserDo.authToken,
					createdAt: rocketChatUserDo.createdAt,
					updatedAt: rocketChatUserDo.updatedAt,
				};

				expect(gettersValues).toEqual(props);
			});
		});
	});
});
