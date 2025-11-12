import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';
import { Registration, RegistrationProps } from './registration.do';
import { LanguageType } from '@shared/domain/interface';
import { registrationFactory } from '../../testing';
import { Consent } from '../type';

describe('Registration', () => {
	let registration: Registration;
	const registrationId: EntityId = 'registrationId';
	const roomId = new ObjectId().toHexString();
	const registrationProps: RegistrationProps = {
		id: registrationId,
		email: 'test@example.com',
		firstName: 'John',
		lastName: 'Doe',
		password: 'password',
		consent: [Consent.TERMS_OF_USE],
		pin: '1234',
		language: LanguageType.DE,
		roomIds: [roomId],
		registrationHash: 'someHashValue',
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

	it('should get firstName', () => {
		const expectedFirstName = 'John';
		expect(registration.firstName).toEqual(expectedFirstName);
	});

	it('should get lastName', () => {
		const expectedLastName = 'Doe';
		expect(registration.lastName).toEqual(expectedLastName);
	});

	it('should get and set password', () => {
		expect(registration.password).toEqual('password');
		registration.password = 'newpassword';
		expect(registration.password).toEqual('newpassword');
	});

	it('should get and set consent', () => {
		expect(registration.consent).toEqual([Consent.TERMS_OF_USE]);
		registration.consent = [Consent.TERMS_OF_USE, Consent.PRIVACY];
		expect(registration.consent).toEqual([Consent.TERMS_OF_USE, Consent.PRIVACY]);
	});

	it('should get and set pin', () => {
		expect(registration.pin).toEqual('1234');
		registration.pin = '5678';
		expect(registration.pin).toEqual('5678');
	});

	it('should get and set language', () => {
		expect(registration.language).toEqual(LanguageType.DE);
		registration.language = LanguageType.EN;
		expect(registration.language).toEqual(LanguageType.EN);
	});

	it('should get and set roomIds', () => {
		expect(registration.roomIds).toEqual([roomId]);
		const newRoomId = new ObjectId().toHexString();
		registration.roomIds = [newRoomId];
		expect(registration.roomIds).toEqual([newRoomId]);
	});

	it('should get registrationHash', () => {
		expect(registration.registrationHash).toBe('someHashValue');
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
