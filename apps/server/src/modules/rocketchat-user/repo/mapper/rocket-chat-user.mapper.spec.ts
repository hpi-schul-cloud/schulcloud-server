import { ObjectId } from '@mikro-orm/mongodb';
import { RocketChatUser } from '../../domain/rocket-chat-user.do';
import { rocketChatUserFactory } from '../../domain/testing/rocket-chat-user.factory';
import { RocketChatUserEntity } from '../../entity';
import { rocketChatUserEntityFactory } from '../../entity/testing/rocket-chat-user.entity.factory';
import { RocketChatUserMapper } from './rocket-chat-user.mapper';

describe(RocketChatUserMapper.name, () => {
	describe('mapToDO', () => {
		describe('When entity is mapped for domainObject', () => {
			it('should properly map the entity to the domain object', () => {
				const entity = rocketChatUserEntityFactory.build();

				const domainObject = RocketChatUserMapper.mapToDO(entity);

				const expectedDomainObject = new RocketChatUser({
					id: entity.id,
					userId: entity.userId.toHexString(),
					username: entity.username,
					rcId: entity.rcId,
					authToken: entity.authToken,
					createdAt: entity.createdAt,
					updatedAt: entity.updatedAt,
				});

				expect(domainObject).toEqual(expectedDomainObject);
			});
		});
	});

	describe('mapToEntity', () => {
		describe('When domainObject is mapped for entity', () => {
			beforeAll(() => {
				jest.useFakeTimers();
				jest.setSystemTime(new Date());
			});

			afterAll(() => {
				jest.useRealTimers();
			});

			it('should properly map the domainObject to the entity', () => {
				const domainObject = rocketChatUserFactory.build();

				const entity = RocketChatUserMapper.mapToEntity(domainObject);

				const expectedEntity = new RocketChatUserEntity({
					id: domainObject.id,
					userId: new ObjectId(domainObject.userId),
					username: domainObject.username,
					rcId: domainObject.rcId,
					authToken: domainObject.authToken,
					createdAt: domainObject.createdAt,
					updatedAt: domainObject.updatedAt,
				});

				expect(entity).toEqual(expectedEntity);
			});
		});
	});
});
