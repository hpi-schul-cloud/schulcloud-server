import { Role } from '@shared/domain';
import { userFactory } from '@shared/domain/factory';
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
		const roles = [new Role({ name: 'name' })] as Role[];
		const user = userFactory.build({ roles });
		const result = ResolvedUserMapper.mapToResponse(user, ['A'], roles);
		expect(result instanceof ResolvedUser).toBe(true);
	});

	it('should work work without second and third parameter and set default values ', () => {
		const roles = [new Role({ name: 'name' })] as Role[];
		const user = userFactory.build({ roles });
		const result = ResolvedUserMapper.mapToResponse(user);
		expect(result instanceof ResolvedUser).toBe(true);
	});

	it.todo('should work with partial user input');
});
