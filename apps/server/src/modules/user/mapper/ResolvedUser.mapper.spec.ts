import { User, Role } from '@shared/domain';
import { schoolFactory } from '@shared/domain/factory/school.factory';
import { setupEntities } from '@src/modules/database';
import { ResolvedUserMapper } from './ResolvedUser.mapper';
import { ResolvedUser } from '../controller/dto';

describe('ResolvedUserMapper', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	it('should has mapToResponse static method', () => {
		expect(typeof ResolvedUserMapper.mapToResponse).toEqual('function');
	});

	it('should work for valid input', () => {
		const school = schoolFactory.build();
		const roles = [new Role({ name: 'name' })] as Role[];
		const user = new User({ email: 'email', roles, school });
		const result = ResolvedUserMapper.mapToResponse(user, ['A'], roles);
		expect(result instanceof ResolvedUser).toBe(true);
	});

	it('should work work without second and third parameter and set default values ', () => {
		const school = schoolFactory.build();
		const roles = [new Role({ name: 'name' })] as Role[];
		const user = new User({ email: 'email', roles, school });
		const result = ResolvedUserMapper.mapToResponse(user);
		expect(result instanceof ResolvedUser).toBe(true);
	});
});
