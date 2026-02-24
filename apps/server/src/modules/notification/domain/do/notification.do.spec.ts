import { Notification } from './notification.do';
import { NotificationType } from '../../types';

describe(Notification.name, () => {
	describe('constructor', () => {
		describe('When constructor is called with required properties', () => {
			const setup = () => {
				const props = {
					id: 'notification-id1',
					type: NotificationType.NOTE,
					key: 'IMPORT_COMPLETED',
					arguments: ['course-123', 'success'],
					userId: 'user-123',
					expiresAt: new Date(),
				};

				const domainObject = new Notification(props);

				return { domainObject };
			};

			it('should create a notification domain object', () => {
				const { domainObject } = setup();

				expect(domainObject instanceof Notification).toEqual(true);
			});
		});

		describe('When constructor is called with a valid id', () => {
			const setup = () => {
				const props = {
					id: 'notification-id-1',
					type: NotificationType.NOTE,
					key: 'IMPORT_FAILED',
					arguments: ['course-456', 'error'],
					userId: 'user-456',
					expiresAt: new Date(),
				};

				const notificationDo = new Notification(props);

				return { props, notificationDo };
			};

			it('should set the id on the notification domain object', () => {
				const { props, notificationDo } = setup();

				expect(notificationDo.id).toEqual(props.id);
			});
		});
	});

	describe('getters', () => {
		describe('When getters are used on a created notification', () => {
			const setup = () => {
				const props = {
					id: 'notification-id-2',
					type: NotificationType.ERROR,
					key: 'IMPORT_IN_PROGRESS',
					arguments: ['course-789', 'progress'],
					userId: 'user-789',
					expiresAt: new Date(),
				};

				const notificationDo = new Notification(props);

				return { props, notificationDo };
			};

			it('should return the values from the underlying props', () => {
				const { props, notificationDo } = setup();

				const getterValues = {
					type: notificationDo.type,
					key: notificationDo.key,
					arguments: notificationDo.arguments,
					userId: notificationDo.userId,
					expiresAt: notificationDo.expiresAt,
				};

				const expectedValues = {
					type: props.type,
					key: props.key,
					arguments: props.arguments,
					userId: props.userId,
					expiresAt: props.expiresAt,
				};

				expect(getterValues).toEqual(expectedValues);
			});
		});
	});
});
