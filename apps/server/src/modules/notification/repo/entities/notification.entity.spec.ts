import { NotificationEntity, NotificationEntityProps } from './notification.entity';

describe(NotificationEntity.name, () => {
	describe('constructor', () => {
		describe('When constructor is called without props', () => {
			it('should throw an error because props parameter is required', () => {
				// @ts-expect-error: Test case for missing constructor argument
				const createEntity = () => new NotificationEntity();
				expect(createEntity).toThrow();
			});
		});

		describe('When constructor is called with all properties', () => {
			const setup = () => {
				const props: NotificationEntityProps = {
					id: 'some-id',
					type: 'INFO',
					key: 'SOME_NOTIFICATION_KEY',
					arguments: ['arg1', 'arg2'],
					userId: 'user-123',
				};

				return { props };
			};

			it('should set all provided properties on the NotificationEntity instance', () => {
				const { props } = setup();
				const entity = new NotificationEntity(props);

				expect(entity.type).toEqual(props.type);
				expect(entity.key).toEqual(props.key);
				expect(entity.arguments).toEqual(props.arguments);
				expect(entity.userId).toEqual(props.userId);
			});
		});
	});
});
