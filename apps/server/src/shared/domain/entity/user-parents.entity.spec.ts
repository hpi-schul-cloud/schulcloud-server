import { UserParentsEntity } from './user-parents.entity';

describe(UserParentsEntity.name, () => {
	describe('constructor', () => {
		describe('When a contructor is called', () => {
			const setup = () => {
				const entity = new UserParentsEntity({ firstName: 'firstName', lastName: 'lastName', email: 'test@test.eu' });

				return { entity };
			};

			it('should contain valid tspUid ', () => {
				const { entity } = setup();

				const userParentsEntity: UserParentsEntity = new UserParentsEntity(entity);

				expect(userParentsEntity.firstName).toEqual(entity.firstName);
				expect(userParentsEntity.lastName).toEqual(entity.lastName);
				expect(userParentsEntity.email).toEqual(entity.email);
			});
		});
	});
});
