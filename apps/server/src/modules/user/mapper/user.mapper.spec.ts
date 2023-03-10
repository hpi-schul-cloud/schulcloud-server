import { UserMapper } from '@src/modules/user/mapper/user.mapper';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { LanguageType, Permission, Role, RoleName, School, User } from '@shared/domain';
import { MikroORM } from '@mikro-orm/core';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { result } from 'lodash';

describe('UserMapper', () => {
	let orm: MikroORM;
	let userDto: UserDto;
	let userEntity: User;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(() => {
		userEntity = userFactory.buildWithId({ roles: [roleFactory.buildWithId()] });
		userDto = new UserDto({
			id: userEntity.id,
			email: userEntity.email,
			firstName: userEntity.firstName,
			lastName: userEntity.lastName,
			roleIds: userEntity.roles.getItems().map((role) => role.id),
			schoolId: userEntity.school.id,
			preferences: userEntity.preferences,
		});
	});

	it('mapFromEntityToDto', () => {
		const resultDto: UserDto = UserMapper.mapFromEntityToDto(userEntity);

		expect(resultDto.id).toEqual(userEntity.id);
		expect(resultDto.email).toEqual(userEntity.email);
		expect(resultDto.firstName).toEqual(userEntity.firstName);
		expect(resultDto.lastName).toEqual(userEntity.lastName);
		expect(resultDto.schoolId).toEqual(userEntity.school.id);
		expect(resultDto.roleIds).toEqual(userEntity.roles.getItems().map((role) => role.id));
		expect(resultDto.ldapDn).toEqual(userEntity.ldapDn);
		expect(resultDto.externalId).toEqual(userEntity.externalId);
		expect(resultDto.language).toEqual(userEntity.language);
		expect(resultDto.forcePasswordChange).toEqual(userEntity.forcePasswordChange);
		expect(resultDto.preferences).toEqual(userEntity.preferences);
		expect(resultDto.lastLoginSystemChange).toEqual(userEntity.lastLoginSystemChange);
		expect(resultDto.outdatedSince).toEqual(userEntity.outdatedSince);
		expect(resultDto.lastSyncedAt).toEqual(userEntity.lastSyncedAt);
	});

	it('mapFromDtoToEntity', () => {
		const resultEntity: User = UserMapper.mapFromDtoToEntity(
			userDto,
			userEntity.roles.getItems(),
			new School({ name: 'schoolName' })
		);

		expect(resultEntity.id).toEqual(userDto.id);
		expect(resultEntity.email).toEqual(userDto.email);
		expect(resultEntity.firstName).toEqual(userDto.firstName);
		expect(resultEntity.lastName).toEqual(userDto.lastName);
		expect(resultEntity.school.id).toEqual(userDto.schoolId);
		expect(resultEntity.roles[0].id).toEqual(userDto.roleIds[0]);
		expect(resultEntity.ldapDn).toEqual(userDto.ldapDn);
		expect(resultEntity.externalId).toEqual(userDto.externalId);
		expect(resultEntity.language).toEqual(userDto.language);
		expect(resultEntity.forcePasswordChange).toEqual(userDto.forcePasswordChange);
		expect(resultEntity.preferences).toEqual(userDto.preferences);
		expect(resultEntity.lastLoginSystemChange).toEqual(userDto.lastLoginSystemChange);
		expect(resultEntity.outdatedSince).toEqual(userDto.outdatedSince);
		expect(resultEntity.lastSyncedAt).toEqual(userDto.lastSyncedAt);
	});

	describe('mapFromEntityToEntity', () => {
		it('map only necessary fields', () => {
			const patch: User = new User({
				email: 'overrideMe',
				firstName: 'overrideMe',
				lastName: 'overrideMe',
				roles: [new Role({ name: RoleName.DEMO, permissions: [Permission.ADMIN_EDIT] })],
				school: new School({
					name: 'overrideMe',
				}),
			});

			const resultEntity = UserMapper.mapFromEntityToEntity(userEntity, patch);

			expect(resultEntity.id).toEqual(userEntity.id);
			expect(resultEntity.email).toEqual(patch.email);
			expect(resultEntity.firstName).toEqual(patch.firstName);
			expect(resultEntity.lastName).toEqual(patch.lastName);
			expect(resultEntity.school).toEqual(patch.school);
			expect(resultEntity.roles).toEqual(patch.roles);
			expect(resultEntity.ldapDn).toEqual(userEntity.ldapDn);
			expect(resultEntity.externalId).toEqual(userEntity.externalId);
			expect(resultEntity.language).toEqual(userEntity.language);
			expect(resultEntity.forcePasswordChange).toEqual(userEntity.forcePasswordChange);
			expect(resultEntity.preferences).toEqual(userEntity.preferences);
			expect(resultEntity.lastLoginSystemChange).toEqual(userEntity.lastLoginSystemChange);
			expect(resultEntity.outdatedSince).toEqual(userEntity.outdatedSince);
			expect(resultEntity.lastSyncedAt).toEqual(userEntity.lastSyncedAt);
		});

		it('map all fields', () => {
			const patch: User = new User({
				email: 'overrideMe',
				firstName: 'overrideMe',
				lastName: 'overrideMe',
				roles: [new Role({ name: RoleName.DEMO, permissions: [Permission.ADMIN_EDIT] })],
				school: new School({
					name: 'overrideMe',
				}),
			});

			patch.ldapDn = 'ldapDn';
			patch.externalId = 'externalId';
			patch.language = LanguageType.DE;
			patch.forcePasswordChange = true;
			patch.preferences = { key: 'value' };
			patch.lastLoginSystemChange = new Date();
			patch.outdatedSince = new Date();
			patch.lastSyncedAt = new Date();

			const resultEntity = UserMapper.mapFromEntityToEntity(userEntity, patch);

			expect(resultEntity.id).toEqual(userEntity.id);
			expect(resultEntity.email).toEqual(patch.email);
			expect(resultEntity.firstName).toEqual(patch.firstName);
			expect(resultEntity.lastName).toEqual(patch.lastName);
			expect(resultEntity.school).toEqual(patch.school);
			expect(resultEntity.roles).toEqual(patch.roles);
			expect(resultEntity.ldapDn).toEqual(patch.ldapDn);
			expect(resultEntity.externalId).toEqual(patch.externalId);
			expect(resultEntity.language).toEqual(patch.language);
			expect(resultEntity.forcePasswordChange).toEqual(patch.forcePasswordChange);
			expect(resultEntity.preferences).toEqual(patch.preferences);
			expect(resultEntity.lastLoginSystemChange).toEqual(patch.lastLoginSystemChange);
			expect(resultEntity.outdatedSince).toEqual(patch.outdatedSince);
			expect(resultEntity.lastSyncedAt).toEqual(patch.lastSyncedAt);
		});

		it("doesn't patch existing lastSyncedAt field if not included in the patch object", () => {
			const patch: User = new User({
				email: 'overrideMe',
				firstName: 'overrideMe',
				lastName: 'overrideMe',
				roles: [new Role({ name: RoleName.DEMO, permissions: [Permission.ADMIN_EDIT] })],
				school: new School({
					name: 'overrideMe',
				}),
			});

			userEntity = userFactory.buildWithId({
				roles: [roleFactory.buildWithId()],
				lastSyncedAt: new Date('2023-01-01'),
			});

			const resultEntity = UserMapper.mapFromEntityToEntity(userEntity, patch);

			expect(resultEntity.id).toEqual(userEntity.id);
			expect(resultEntity.email).toEqual(patch.email);
			expect(resultEntity.firstName).toEqual(patch.firstName);
			expect(resultEntity.lastName).toEqual(patch.lastName);
			expect(resultEntity.roles).toEqual(patch.roles);
			expect(resultEntity.school).toEqual(patch.school);
			expect(resultEntity.lastSyncedAt).toEqual(userEntity.lastSyncedAt);
		});

		it('patch existing lastSyncedAt field', () => {
			const patch: User = new User({
				email: 'overrideMe',
				firstName: 'overrideMe',
				lastName: 'overrideMe',
				roles: [new Role({ name: RoleName.DEMO, permissions: [Permission.ADMIN_EDIT] })],
				school: new School({
					name: 'overrideMe',
				}),
				lastSyncedAt: new Date(),
			});

			userEntity = userFactory.buildWithId({
				roles: [roleFactory.buildWithId()],
				lastSyncedAt: new Date('2023-01-01'),
			});

			const resultEntity = UserMapper.mapFromEntityToEntity(userEntity, patch);

			expect(resultEntity.id).toEqual(userEntity.id);
			expect(resultEntity.email).toEqual(patch.email);
			expect(resultEntity.firstName).toEqual(patch.firstName);
			expect(resultEntity.lastName).toEqual(patch.lastName);
			expect(resultEntity.roles).toEqual(patch.roles);
			expect(resultEntity.school).toEqual(patch.school);
			expect(resultEntity.lastSyncedAt).toEqual(patch.lastSyncedAt);
		});
	});
});
