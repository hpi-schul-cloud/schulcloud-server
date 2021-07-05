import { ObjectId } from '@mikro-orm/mongodb';
import { ResolvedUserMapper } from './ResolvedUser.mapper';
import { ResolvedUser } from '../controller/dto';
import { User, Role } from '../entity';

describe('ResolvedUserMapper', () => {
	it('should has mapToResponse static method', () => {
		expect(typeof ResolvedUserMapper.mapToResponse).toEqual('function');
	});

	it('should work for valid input', () => {
		const school = new ObjectId().toHexString();
		const roles = [new Role({ name: 'name' })] as Role[];
		const user = new User({ email: 'email', roles, school });
		const result = ResolvedUserMapper.mapToResponse(user, ['A'], roles);
		expect(result instanceof ResolvedUser).toBe(true);
	});

	it('should work work without second and third parameter and set default values ', () => {
		const school = new ObjectId().toHexString();
		const roles = [new Role({ name: 'name' })] as Role[];
		const user = new User({ email: 'email', roles, school });
		const result = ResolvedUserMapper.mapToResponse(user);
		expect(result instanceof ResolvedUser).toBe(true);
	});

	it.todo('should work with partial user input');
});
