import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';
import { RegistrationConfig } from '../../registration.config';
import { registrationFactory } from '../../testing';
import { Registration, RegistrationProps } from './registration.do';

describe('Registration', () => {
	const setup = (overwrites: Partial<RegistrationProps> = {}) => {
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
			...overwrites,
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
		expect(registration.lastName).toEqual('Doe');

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

	it('should get and set resentAt', () => {
		const { registration } = setup();

		expect(registration.resentAt).toBeUndefined();

		const newResentAt = new Date();
		registration.resentAt = newResentAt;

		expect(registration.resentAt).toEqual(newResentAt);
	});

	describe('addRoomId', () => {
		describe('When room is added to the registration', () => {
			it('should add the room to the roomIds', () => {
				const testRoomId = new ObjectId().toHexString();
				const { registration, roomId } = setup({ roomIds: [testRoomId] });

				registration.addRoomId(roomId);

				expect(registration.roomIds).toContain(roomId);
			});

			it('should add roomId only once', () => {
				const roomId = new ObjectId().toHexString();
				const { registration } = setup({ roomIds: [roomId] });

				registration.addRoomId(roomId);

				expect(registration.roomIds).toHaveLength(1);
				expect(registration.roomIds).toContain(roomId);
			});
		});
	});

	describe('removeRoomId', () => {
		it('should remove the roomId from roomIds', () => {
			const roomId = new ObjectId().toHexString();
			const { registration } = setup({ roomIds: [roomId] });

			registration.removeRoomId(roomId);

			expect(registration.roomIds).not.toContain(roomId);
		});

		it('should do nothing when roomId does not exist', () => {
			const roomId = new ObjectId().toHexString();
			const { registration } = setup({ roomIds: [roomId] });

			const nonExistingRoomId = new ObjectId().toHexString();
			registration.removeRoomId(nonExistingRoomId);

			expect(registration.roomIds).toHaveLength(1);
			expect(registration.roomIds).toContain(roomId);
		});
	});

	describe('hasNoRoomIds', () => {
		it('should return true when there are no roomIds', () => {
			const { registration } = setup({ roomIds: [] });

			const result = registration.hasNoRoomIds();

			expect(result).toBe(true);
		});

		it('should return false when there are roomIds', () => {
			const roomId = new ObjectId().toHexString();
			const { registration } = setup({ roomIds: [roomId] });
			const result = registration.hasNoRoomIds();

			expect(result).toBe(false);
		});
	});

	describe('generateRegistrationMail', () => {
		it('should generate registration mail with correct structure', () => {
			const { registration } = setup();
			const roomName = 'Test Room';
			const config: RegistrationConfig = {
				featureExternalPersonRegistrationEnabled: true,
				fromEmailAddress: 'example@sender.com',
				hostUrl: 'https://example.com',
				scTitle: 'dBildungscloud',
			};

			const result = registration.generateRegistrationMail(roomName, config);

			const expectedSubject = `dBildungscloud: Einladung zur Registrierung und Zugriff auf den Raum ${roomName}`;
			let expectedHtmlContent = `<div lang=\"de\">Hallo John Doe,
<p>dies ist eine Einladung, dem Raum Test Room beizutreten. Um den Raum betreten zu können, ist eine Registrierung in der dBildungscloud erforderlich. Bitte auf den folgenden Link klicken, um die Registrierung vorzunehmen:<br />
https://example.com/registration-external-members/?registration-secret=someValue<br />
Hinweis: Der Link sollte nicht weitergegeben und nur in einer sicheren Umgebung verwendet werden.<br />
Nach der Registrierung wird der Zugriff auf den Raum Test Room sofort freigeschaltet.
</p>
Mit freundlichen Grüßen<br />
dBildungscloud-Team</div><hr /><div lang=\"en\">Hello John Doe,
<p>This is an invitation to join the Test Room room. To enter the room, you must register with dBildungscloud. Please click on the following link to register:<br />
https://example.com/registration-external-members/?registration-secret=someValue<br />
Note: The link should not be shared and should only be used in a secure environment.<br />
After registration, access to the room Test Room will be activated immediately.
</p>
Best regards,<br />
dBildungscloud team</div>`;
			const expectedPlainTextContent = `Hallo John Doe,
dies ist eine Einladung, dem Raum Test Room beizutreten. Um den Raum betreten zu können, ist eine Registrierung in der dBildungscloud erforderlich. Bitte auf den folgenden Link klicken, um die Registrierung vorzunehmen:
https://example.com/registration-external-members/?registration-secret=someValue
Hinweis: Der Link sollte nicht weitergegeben und nur in einer sicheren Umgebung verwendet werden.
Nach der Registrierung wird der Zugriff auf den Raum Test Room sofort freigeschaltet.

Mit freundlichen Grüßen
dBildungscloud-Team

------------

Hello John Doe,
This is an invitation to join the Test Room room. To enter the room, you must register with dBildungscloud. Please click on the following link to register:
https://example.com/registration-external-members/?registration-secret=someValue
Note: The link should not be shared and should only be used in a secure environment.
After registration, access to the room Test Room will be activated immediately.

Best regards,
dBildungscloud team`;

			expectedHtmlContent = '';

			expect(result.mail.subject).toBe(expectedSubject);
			expect(result.mail.htmlContent).toBe(expectedHtmlContent);
			expect(result.mail.plainTextContent).toBe(expectedPlainTextContent);
			expect(result.recipients).toEqual([registration.email]);
			expect(result.from).toBe('example@sender.com');
		});
	});
});
