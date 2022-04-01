import { userFactory, roleFactory, setupEntities } from '@shared/testing';
import { ResolvedUserMapper } from './resolved-user.mapper';
import { ResolvedUserResponse } from '../controller/dto';

describe('ResolvedUserMapper', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	it('should has mapToResponse static method', () => {
		expect(typeof ResolvedUserMapper.mapToResponse).toEqual('function');
	});

	it('should work for valid input', () => {
		const roles = roleFactory.buildList(1);
		const user = userFactory.build({ roles });
		const result = ResolvedUserMapper.mapToResponse(user, ['A'], roles);
		expect(result instanceof ResolvedUserResponse).toBe(true);
	});

	it('should work work without second and third parameter and set default values ', () => {
		const roles = roleFactory.buildList(1);
		const user = userFactory.build({ roles });
		const result = ResolvedUserMapper.mapToResponse(user);
		expect(result instanceof ResolvedUserResponse).toBe(true);
	});
});
