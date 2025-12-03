import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';
import { registrationFactory } from '../../testing';
import { Registration, RegistrationProps } from './registration.do';
import { Configuration } from '@hpi-schul-cloud/commons/lib';

describe('Registration', () => {
	const setup = (roomIds?: string[]) => {
		const registrationId: EntityId = 'registrationId';
		const roomId = new ObjectId().toHexString();
		const registrationProps: RegistrationProps = {
			id: registrationId,
			email: 'test@example.com',
			firstName: 'John',
			lastName: 'Doe',
			roomIds: roomIds ?? [roomId],
			registrationSecret: 'someValue',
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const registration = new Registration(registrationProps);
		return { registration, registrationProps, roomId };
	};

	it('should props without domainObject', () => {
		const { registration, registrationProps } = setup();
		const mockDomainObject = registrationFactory.build();
		// this tests the hotfix for the mikro-orm issue
		// eslint-disable-next-line @typescript-eslint/dot-notation
		registration['domainObject'] = mockDomainObject;

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { domainObject, ...props } = registration.getProps();

		expect(domainObject).toEqual(undefined);
		expect(props).toEqual(registrationProps);
	});

	it('should get email', () => {
		const { registration } = setup();

		expect(registration.email).toEqual('test@example.com');
	});

	it('should get and set firstName', () => {
		const { registration } = setup();
		expect(registration.firstName).toEqual('John');

		const newFirstName = 'Jane';
		registration.firstName = newFirstName;
		expect(registration.firstName).toEqual(newFirstName);
	});

	it('should get and set lastName', () => {
		const { registration } = setup();
		const expectedLastName = 'Doe';

		expect(registration.lastName).toEqual(expectedLastName);

		const newLastName = 'Smith';

		registration.lastName = newLastName;
		expect(registration.lastName).toEqual(newLastName);
	});

	it('should update name', () => {
		const { registration } = setup();

		expect(registration.firstName).toEqual('John');
		expect(registration.lastName).toEqual('Doe');

		const newFirstName = 'Jane';
		const newLastName = 'Smith';
		registration.updateName({ firstName: newFirstName, lastName: newLastName });

		expect(registration.firstName).toEqual(newFirstName);
		expect(registration.lastName).toEqual(newLastName);
	});

	it('should get roomIds', () => {
		const { registration, roomId } = setup();
		expect(registration.roomIds).toEqual([roomId]);
	});

	it('should get registrationSescret', () => {
		const { registration } = setup();
		expect(registration.registrationSecret).toBe('someValue');
	});

	it('should get createdAt', () => {
		const { registration } = setup();
		expect(registration.createdAt).toBeInstanceOf(Date);
	});

	it('should get updatedAt', () => {
		const { registration } = setup();
		expect(registration.updatedAt).toBeInstanceOf(Date);
	});

	describe('addRoomId', () => {
		describe('When room is added to the registration', () => {
			/*
			const setup = () => {
				const registration = registrationFactory.build({ roomIds: [] });
				const roomId = new ObjectId().toHexString();

				return {
					registration,
					roomId,
				};
			};
			*/

			it('should add the room to the roomIds', () => {
				const testRoomId = new ObjectId().toHexString();
				const { registration, roomId } = setup([testRoomId]);

				registration.addRoomId(roomId);

				expect(registration.roomIds).toContain(roomId);
			});

			it('should add roomId only once', () => {
				const roomId = new ObjectId().toHexString();
				const { registration } = setup([roomId]);

				registration.addRoomId(roomId);

				expect(registration.roomIds).toHaveLength(1);
				expect(registration.roomIds).toContain(roomId);
			});
		});
	});
	describe('generateRegistrationMail', () => {
		beforeEach(() => {
			jest.spyOn(Configuration, 'get').mockImplementation((config: string) => {
				if (config === 'SMTP_SENDER') {
					return 'example@sender.com';
				}
				if (config === 'HOST') {
					return 'https://example.com';
				}
				return null;
			});
		});

		it('should generate registration mail with correct structure', () => {
			const { registration } = setup();

			const result = registration.generateRegistrationMail();

			expect(Configuration.get).toHaveBeenCalledWith('SMTP_SENDER');
			expect(Configuration.get).toHaveBeenCalledWith('HOST');

			expect(result).toEqual(
				expect.objectContaining({
					recipients: [registration.email],
					from: 'example@sender.com',
				})
			);
		});
	});
});
