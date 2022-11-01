import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { ProvisioningUserOutputDto } from '@src/modules/provisioning/dto/provisioning-user-output.dto';
import { MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@shared/testing';
import { UserUcMapper } from '@src/modules/user/mapper/user.uc.mapper';
import { EntityId } from '@shared/domain';

describe('UserUcMapper', () => {
	let orm: MikroORM;
	let schoolId: EntityId;
	let roleIds: EntityId[];
	let provisioningUserOutputDto: ProvisioningUserOutputDto;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(() => {
		schoolId = 'schoolId1';
		roleIds = ['roleId1', 'roleId2'];
		provisioningUserOutputDto = new ProvisioningUserOutputDto({
			id: 'asdhjasd',
			email: '',
			externalId: 'external1234',
			lastName: 'lastName',
			firstName: 'firstName',
			roleNames: [],
			schoolId,
		});
	});

	it('mapFromProvisioningUserOutputDtoToUserDto', () => {
		const resultDto: UserDto = UserUcMapper.mapFromProvisioningUserOutputDtoToUserDto(
			provisioningUserOutputDto,
			roleIds
		);

		expect(resultDto.id).toEqual(provisioningUserOutputDto.id);
		expect(resultDto.email).toEqual(provisioningUserOutputDto.email);
		expect(resultDto.firstName).toEqual(provisioningUserOutputDto.firstName);
		expect(resultDto.lastName).toEqual(provisioningUserOutputDto.lastName);
		expect(resultDto.roleIds).toEqual(roleIds);
		expect(resultDto.schoolId).toEqual(provisioningUserOutputDto.schoolId);
		expect(resultDto.externalId).toEqual(provisioningUserOutputDto.externalId);
	});
});
