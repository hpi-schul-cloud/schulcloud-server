import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';
import { registrationFactory } from '../../testing';
import { Registration, RegistrationProps } from './registration.do';

describe('Registration', () => {
	let registration: Registration;
	const registrationId: EntityId = 'registrationId';
	const roomId = new ObjectId().toHexString();
	const registrationProps: RegistrationProps = {
		id: registrationId,
		email: 'test@example.com',
		firstName: 'John',
		lastName: 'Doe',
		roomIds: [roomId],
		registrationSecret: 'someValue',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(() => {
		registration = new Registration(registrationProps);
	});

	it('should props without domainObject', () => {
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
		const expectedEmail = 'test@example.com';
		expect(registration.email).toEqual(expectedEmail);
	});

	it('should get and set firstName', () => {
		const expectedFirstName = 'John';
		expect(registration.firstName).toEqual(expectedFirstName);
		const newFirstName = 'Jane';
		registration.firstName = newFirstName;
		expect(registration.firstName).toEqual(newFirstName);
	});

	it('should get and set lastName', () => {
		const expectedLastName = 'Doe';
		expect(registration.lastName).toEqual(expectedLastName);
		const newLastName = 'Smith';
		registration.lastName = newLastName;
		expect(registration.lastName).toEqual(newLastName);
	});

	it('should update name', () => {
		const expectedFirstName = 'John';
		const expectedLastName = 'Doe';
		expect(registration.firstName).toEqual(expectedFirstName);
		expect(registration.lastName).toEqual(expectedLastName);

		const newFirstName = 'Jane';
		const newLastName = 'Smith';
		registration.updateName({ firstName: newFirstName, lastName: newLastName });
		expect(registration.firstName).toEqual(newFirstName);
		expect(registration.lastName).toEqual(newLastName);
	});

	it('should get roomIds', () => {
		expect(registration.roomIds).toEqual([roomId]);
	});

	it('should get registrationHash', () => {
		expect(registration.registrationSecret).toBe('someValue');
	});

	it('should get createdAt', () => {
		expect(registration.createdAt).toBeInstanceOf(Date);
	});

	it('should get updatedAt', () => {
		expect(registration.updatedAt).toBeInstanceOf(Date);
	});

	describe('addRoomId', () => {
		describe('When room is added to the registration', () => {
			const setup = () => {
				const registration = registrationFactory.build({ roomIds: [] });
				const roomId = new ObjectId().toHexString();

				return {
					registration,
					roomId,
				};
			};

			it('should add the room to the roomIds', () => {
				const { registration, roomId } = setup();

				registration.addRoomId(roomId);

				expect(registration.roomIds).toContain(roomId);
			});

			it('should add roomId only once', () => {
				const { registration, roomId } = setup();

				registration.addRoomId(roomId);
				registration.addRoomId(roomId);

				expect(registration.roomIds).toHaveLength(1);
				expect(registration.roomIds).toContain(roomId);
			});
		});
	});
});
