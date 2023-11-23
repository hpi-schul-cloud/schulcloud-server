import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { cleanupCollections, userFactory } from '@shared/testing';
import { RegistrationPinRepo } from './registration-pin.repo';
import { registrationPinEntityFactory } from '../entity/testing/factory/registration-pin.entity.factory';

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

	describe('deleteRegistrationPinByEmail', () => {
		const setup = async () => {
			const user = userFactory.buildWithId();
			const userWithoutRegistrationPin = userFactory.buildWithId();
			const registrationPinForUser = registrationPinEntityFactory.buildWithId({ email: user.email });

			await em.persistAndFlush(registrationPinForUser);

			return {
				user,
				userWithoutRegistrationPin,
			};
		};

		describe('when registrationPin exists', () => {
			it('should delete registrationPins by email', async () => {
				const { user } = await setup();

				const result: number = await repo.deleteRegistrationPinByEmail(user.email);

				expect(result).toEqual(1);
			});
		});

		describe('when there is no registrationPin', () => {
			it('should return empty array', async () => {
				const { userWithoutRegistrationPin } = await setup();

				const result: number = await repo.deleteRegistrationPinByEmail(userWithoutRegistrationPin.email);
				expect(result).toEqual(0);
			});
		});
	});
});
