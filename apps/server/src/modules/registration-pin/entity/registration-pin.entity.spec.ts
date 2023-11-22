import { setupEntities } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { RegistrationPinsEntity } from './registration-pin.entity';

describe(RegistrationPinsEntity.name, () => {
	beforeAll(async () => {
		await setupEntities();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	const setup = () => {
		const props = {
			id: new ObjectId().toHexString(),
			email: 'test@test.eu',
			pin: 'test123',
			verified: false,
			importHash: '02a00804nnQbLbCDEMVuk56pzZ3A0SC2cYnmM9cyY25IVOnf0K3YCKqW6zxC',
		};

		return { props };
	};

	describe('constructor', () => {
		describe('When constructor is called', () => {
			it('should throw an error by empty constructor', () => {
				// @ts-expect-error: Test case
				const test = () => new RegistrationPinsEntity();
				expect(test).toThrow();
			});

			it('should create a registrationPins by passing required properties', () => {
				const { props } = setup();
				const entity: RegistrationPinsEntity = new RegistrationPinsEntity(props);

				expect(entity instanceof RegistrationPinsEntity).toEqual(true);
			});

			it(`should return a valid object with fields values set from the provided complete props object`, () => {
				const { props } = setup();
				const entity: RegistrationPinsEntity = new RegistrationPinsEntity(props);

				const entityProps = {
					id: entity.id,
					email: entity.email,
					pin: entity.pin,
					verified: entity.verified,
					importHash: entity.importHash,
				};

				expect(entityProps).toEqual(props);
			});
		});
	});
});
