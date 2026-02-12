import { Notification } from '../../domain/do/notification.do';
import { NotificationEntity } from '../entities';
import { NotificationMapper } from './notification.mapper';

describe(NotificationMapper.name, () => {
	const fixedDate = new Date('2023-01-01T00:00:00.000Z');

	beforeAll(() => {
		jest.useFakeTimers();
		jest.setSystemTime(fixedDate);
	});

	afterAll(() => {
		jest.useRealTimers();
	});

	describe('mapToDO', () => {
		describe('When a notification entity is mapped to a domain object', () => {
			const setup = () => {
				const entity = {
					id: 'notification-id',
					type: 'NOTIFICATION_TYPE',
					key: 'NOTIFICATION_KEY',
					arguments: ['arg1', 'arg2'],
					userId: 'user-id',
					createdAt: new Date(),
					updatedAt: new Date(),
				} as NotificationEntity;

				const expectedDomainObject = new Notification({
					id: entity.id,
					type: entity.type,
					key: entity.key,
					arguments: entity.arguments,
					userId: entity.userId,
					createdAt: fixedDate,
					updatedAt: fixedDate,
				});

				return { entity, expectedDomainObject };
			};

			it('should properly map all notification properties from entity to domain object', () => {
				const { entity, expectedDomainObject } = setup();

				const domainObject = NotificationMapper.mapToDO(entity);

				expect(domainObject).toEqual(expectedDomainObject);
			});
		});

		describe('When a notification entity is mapped to an empty domain object', () => {
			const setup = () => {
				const entity = {
					id: 'notification-id',
					createdAt: new Date(),
					updatedAt: new Date(),
				} as NotificationEntity;

				const expectedDomainObject = new Notification({
					id: entity.id,
					type: '',
					key: '',
					arguments: [],
					userId: '',
					createdAt: new Date(),
					updatedAt: new Date(),
				});

				return { entity, expectedDomainObject };
			};

			it('should properly map all notification properties from entity to domain object', () => {
				const { entity, expectedDomainObject } = setup();

				const domainObject = NotificationMapper.mapToDO(entity);

				expect(domainObject).toEqual(expectedDomainObject);
			});
		});
	});

	describe('mapToDOs', () => {
		describe('When an empty notification entities array is mapped to domain objects', () => {
			it('should return an empty domain objects array for an empty entities array', () => {
				const domainObjects = NotificationMapper.mapToDOs([]);

				expect(domainObjects).toEqual([]);
			});
		});

		describe('When multiple notification entities are mapped to domain objects', () => {
			const setup = () => {
				const entities: NotificationEntity[] = [
					{
						id: 'notification-id-1',
						type: 'NOTIFICATION_TYPE_1',
						key: 'NOTIFICATION_KEY_1',
						arguments: ['arg1'],
						userId: 'user-id-1',
						createdAt: new Date(),
						updatedAt: new Date(),
					} as NotificationEntity,
					{
						id: 'notification-id-2',
						type: 'NOTIFICATION_TYPE_2',
						key: 'NOTIFICATION_KEY_2',
						arguments: ['arg2a', 'arg2b'],
						userId: 'user-id-2',
						createdAt: new Date(),
						updatedAt: new Date(),
					} as NotificationEntity,
				];

				const expectedDomainObjects = entities.map(
					(entity) =>
						new Notification({
							id: entity.id,
							type: entity.type,
							key: entity.key,
							arguments: entity.arguments,
							userId: entity.userId,
							createdAt: entity.createdAt,
							updatedAt: entity.updatedAt,
						})
				);

				return { entities, expectedDomainObjects };
			};

			it('should properly map all notification entities to domain objects', () => {
				const { entities, expectedDomainObjects } = setup();

				const domainObjects = NotificationMapper.mapToDOs(entities);

				expect(domainObjects).toEqual(expectedDomainObjects);
			});
		});
	});

	describe('mapToEntity', () => {
		describe('When a notification domain object is mapped to an entity', () => {
			const setup = () => {
				const domainObject = new Notification({
					id: 'notification-id',
					type: 'NOTIFICATION_TYPE',
					key: 'NOTIFICATION_KEY',
					arguments: ['arg1', 'arg2'],
					userId: 'user-id',
					createdAt: new Date(),
					updatedAt: new Date(),
				});

				const expectedEntity = new NotificationEntity({
					type: domainObject.type,
					key: domainObject.key,
					arguments: domainObject.arguments,
					userId: domainObject.userId,
					id: domainObject.id,
					createdAt: new Date(),
					updatedAt: new Date(),
				});

				return { domainObject, expectedEntity };
			};

			it('should properly map all notification properties from domain object to entity and set timestamps', () => {
				const { domainObject, expectedEntity } = setup();

				const entity = NotificationMapper.mapToEntity(domainObject);

				expect(entity).toBeInstanceOf(NotificationEntity);
				expect(entity).toEqual(expectedEntity);
			});
		});

		describe('When a notification domain object is mapped to an empty entity', () => {
			const setup = () => {
				const domainObject = {
					id: 'testid',
					createdAt: new Date(),
					updatedAt: new Date(),
				} as Notification;

				const expectedEntity = new NotificationEntity({
					type: '',
					key: '',
					arguments: [],
					userId: '',
					id: domainObject.id,
					createdAt: new Date(),
					updatedAt: new Date(),
				});

				return { domainObject, expectedEntity };
			};

			it('should properly map all empty notification properties from domain object to entity and set timestamps', () => {
				const { domainObject, expectedEntity } = setup();

				const entity = NotificationMapper.mapToEntity(domainObject);

				expect(entity).toBeInstanceOf(NotificationEntity);
				expect(entity).toEqual(expectedEntity);
			});
		});
	});

	describe('mapToEntities', () => {
		describe('When an empty notification domain objects array is mapped to entities', () => {
			it('should return an empty entities array for an empty domain objects array', () => {
				const entities = NotificationMapper.mapToEntities([]);

				expect(entities).toEqual([]);
			});
		});

		describe('When multiple notification domain objects are mapped to entities', () => {
			const setup = () => {
				const domainObjects = [
					new Notification({
						id: 'notification-id-1',
						type: 'NOTIFICATION_TYPE_1',
						key: 'NOTIFICATION_KEY_1',
						arguments: ['arg1'],
						userId: 'user-id-1',
						createdAt: new Date(),
						updatedAt: new Date(),
					}),
					new Notification({
						id: 'notification-id-2',
						type: 'NOTIFICATION_TYPE_2',
						key: 'NOTIFICATION_KEY_2',
						arguments: ['arg2a', 'arg2b'],
						userId: 'user-id-2',
						createdAt: new Date(),
						updatedAt: new Date(),
					}),
				];

				const expectedEntities = domainObjects.map(
					(domainObject) =>
						new NotificationEntity({
							type: domainObject.type,
							key: domainObject.key,
							arguments: domainObject.arguments,
							userId: domainObject.userId,
							id: domainObject.id,
							createdAt: fixedDate,
							updatedAt: fixedDate,
						})
				);

				return { domainObjects, expectedEntities };
			};

			it('should properly map all notification domain objects to entities and set timestamps', () => {
				const { domainObjects, expectedEntities } = setup();

				const entities = NotificationMapper.mapToEntities(domainObjects);

				expect(entities).toHaveLength(expectedEntities.length);
				expect(entities).toEqual(expectedEntities);
			});
		});
	});
});
