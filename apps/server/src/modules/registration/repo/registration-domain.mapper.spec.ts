import { ObjectId } from '@mikro-orm/mongodb';
import { registrationEntityFactory } from '../testing';
import { RegistrationEntity } from './entity';
import { RegistrationDomainMapper } from './registration-domain.mapper';
import { Registration, RegistrationProps } from '../domain/do';
import { LanguageType } from '@shared/domain/interface';
import { Consent } from '../domain/type';

describe('RegistrationDomainMapper', () => {
	describe('mapEntityToDo', () => {
		it('should correctly map RegistrationEntity to Registration domain object', () => {
			const roomId = new ObjectId().toHexString();

			const registrationEntity = {
				id: '1',
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
				password: '',
				consent: [Consent.TERMS_OF_USE],
				pin: '',
				language: LanguageType.DE,
				roomIds: [roomId],
				registrationHash: 'someHash',
			} as RegistrationEntity;

			const result = RegistrationDomainMapper.mapEntityToDo(registrationEntity);

			expect(result).toBeInstanceOf(Registration);
			expect(result.getProps()).toEqual({
				id: '1',
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
				password: '',
				consent: [Consent.TERMS_OF_USE],
				pin: '',
				language: LanguageType.DE,
				roomIds: [roomId],
				registrationHash: 'someHash',
			});
		});

		it('should return existing domainObject if present, regardless of entity properties', () => {
			const roomId = new ObjectId().toHexString();

			const existingRegistration = new Registration({
				id: '1',
				email: 'test@example.com',
				firstName: 'Existing',
				lastName: 'User',
				password: '',
				consent: [Consent.TERMS_OF_USE],
				pin: '',
				language: LanguageType.DE,
				roomIds: [roomId],
				registrationHash: 'someHash',
				createdAt: new Date('2023-01-01'),
				updatedAt: new Date('2023-01-01'),
			});

			const registrationEntity = {
				id: '2',
				email: 'test2@example.com',
				firstName: 'Test2',
				lastName: 'User2',
				password: '',
				consent: [Consent.PRIVACY],
				pin: '',
				language: LanguageType.DE,
				roomIds: [roomId],
				registrationHash: 'someHash',
				domainObject: existingRegistration,
			} as RegistrationEntity;

			const result = RegistrationDomainMapper.mapEntityToDo(registrationEntity);

			expect(result).toBe(existingRegistration);
			expect(result).toBeInstanceOf(Registration);
			expect(result.getProps()).toEqual({
				id: '1',
				email: 'test@example.com',
				firstName: 'Existing',
				lastName: 'User',
				password: '',
				consent: [Consent.TERMS_OF_USE],
				pin: '',
				language: LanguageType.DE,
				roomIds: [existingRegistration.roomIds[0]],
				registrationHash: 'someHash',
				createdAt: new Date('2023-01-01'),
				updatedAt: new Date('2023-01-01'),
			});
			expect(result.getProps().id).toBe('1');
			expect(result.getProps().id).not.toBe(registrationEntity.id);
		});

		it('should wrap the actual entity reference in the domain object', () => {
			const registrationEntity = {
				id: '1',
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
				password: '',
				consent: [Consent.TERMS_OF_USE],
				pin: '',
				language: LanguageType.DE,
				roomIds: [new ObjectId().toHexString()],
				registrationHash: 'someHash',
			} as RegistrationEntity;

			const result = RegistrationDomainMapper.mapEntityToDo(registrationEntity);
			// @ts-expect-error check necessary
			const { props } = result;

			expect(props === registrationEntity).toBe(true);
		});
	});

	describe('mapDoToEntity', () => {
		describe('when domain object props are instanceof RegistrationEntity', () => {
			it('should return the entity', () => {
				const registrationEntity = registrationEntityFactory.build();
				const registration = new Registration(registrationEntity);

				const result = RegistrationDomainMapper.mapDoToEntity(registration);

				expect(result).toBe(registrationEntity);
			});
		});

		describe('when domain object props are not instanceof RegistrationEntity', () => {
			it('should convert them to an entity and return it', () => {
				const registrationEntity: RegistrationProps = {
					id: '66d581c3ef74c548a4efea1e',
					email: 'test@example.com',
					firstName: 'Test',
					lastName: 'User #1',
					password: '',
					consent: [Consent.TERMS_OF_USE],
					pin: '',
					language: LanguageType.DE,
					roomIds: [new ObjectId().toHexString()],
					registrationHash: 'someHash',
					createdAt: new Date('2024-10-1'),
					updatedAt: new Date('2024-10-1'),
				};
				const registration = new Registration(registrationEntity);

				const result = RegistrationDomainMapper.mapDoToEntity(registration);

				expect(result).toBeInstanceOf(RegistrationEntity);
				expect(result).toMatchObject(registrationEntity);
			});
		});
	});
});
