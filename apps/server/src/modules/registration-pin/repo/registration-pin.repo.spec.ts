import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { cleanupCollections, userFactory } from '@shared/testing';
import { RegistrationPinRepo } from '.';
import { registrationPinEntityFactory } from '../entity/testing';

describe(RegistrationPinRepo.name, () => {
	let module: TestingModule;
	let repo: RegistrationPinRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [RegistrationPinRepo],
		}).compile();

		repo = module.get(RegistrationPinRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('findAllByEmail', () => {
		const setup = async () => {
			const user = userFactory.buildWithId();
			const userWithoutRegistrationPin = userFactory.buildWithId();
			const registrationPinForUser = registrationPinEntityFactory.buildWithId({ email: user.email });

			await em.persistAndFlush(registrationPinForUser);

			const expectedResult = [[registrationPinForUser], 1];
			const expectedResultForNoRegistrationPin = [[], 0];

			return {
				expectedResult,
				expectedResultForNoRegistrationPin,
				user,
				userWithoutRegistrationPin,
			};
		};

		describe('when registrationPin exists', () => {
			it('should delete registrationPins by email', async () => {
				const { expectedResult, user } = await setup();

				const result = await repo.findAllByEmail(user.email);

				expect(result).toEqual(expectedResult);
			});
		});

		describe('when there is no registrationPin', () => {
			it('should return count equal 0 and an empty array', async () => {
				const { expectedResultForNoRegistrationPin, userWithoutRegistrationPin } = await setup();

				const result = await repo.findAllByEmail(userWithoutRegistrationPin.email);

				expect(result).toEqual(expectedResultForNoRegistrationPin);
			});
		});
	});

	describe('deleteRegistrationPinByEmail', () => {
		const setup = async () => {
			const user = userFactory.buildWithId();
			const userWithoutRegistrationPin = userFactory.buildWithId();
			const registrationPinForUser = registrationPinEntityFactory.buildWithId({ email: user.email });

			await em.persistAndFlush(registrationPinForUser);

			const expectedResult = 1;

			return {
				expectedResult,
				user,
				userWithoutRegistrationPin,
			};
		};

		describe('when registrationPin exists', () => {
			it('should delete registrationPins by email', async () => {
				const { expectedResult, user } = await setup();

				const result = await repo.deleteRegistrationPinByEmail(user.email);

				expect(result).toEqual(expectedResult);
			});
		});

		describe('when there is no registrationPin', () => {
			it('should return empty array', async () => {
				const { userWithoutRegistrationPin } = await setup();

				const result = await repo.deleteRegistrationPinByEmail(userWithoutRegistrationPin.email);

				expect(result).toEqual(0);
			});
		});
	});
});
