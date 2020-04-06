const { expect } = require('chai');

const { preparedRoles, addDisplayName } = require('../../../../src/services/role/utils');

describe('preparedRoles', () => {
	const role0 = {
		_id: '0',
		name: 'user',
		roles: [],
		permissions: ['a', 'b', 'c', 'd', 'e'],
	};
	const role1 = {
		_id: '1',
		name: 'student',
		roles: ['0'],
		permissions: ['a', 'student'],
	};
	const role2 = {
		_id: '2',
		name: 'teacher',
		roles: ['0'],
		permissions: ['b', 'teacher1', 'teacher2'],
	};
	const role3 = {
		_id: '3',
		name: 'administrator',
		roles: ['2'],
		permissions: ['c', 'administrator'],
	};
	const role4 = {
		_id: '4',
		name: 'superhero',
		roles: ['0', '1', '3'],
		permissions: ['d', 'superhero'],
	};
		// change the sorting will effect the test result
	const roles = [role0, role1, role2, role3, role4];

	it('should prepare inherit and multiple roles in different levels and add display names if exist.', () => {
		const result = preparedRoles(roles);
		expect(result).to.deep.equal([
			{
				_id: '0',
				name: 'user',
				roles: [],
				displayName: '',
				permissions: ['a', 'b', 'c', 'd', 'e'],
			},
			{
				_id: '1',
				name: 'student',
				roles: ['0'],
				displayName: 'Schüler',
				permissions: ['a', 'student', 'b', 'c', 'd', 'e'],
			},
			{
				_id: '2',
				name: 'teacher',
				roles: ['0'],
				displayName: 'Lehrer',
				permissions: ['b', 'teacher1', 'teacher2', 'a', 'c', 'd', 'e'],
			},
			{
				_id: '3',
				name: 'administrator',
				roles: ['2'],
				displayName: 'Administrator',
				permissions: ['c', 'administrator', 'b', 'teacher1', 'teacher2', 'a', 'd', 'e'],
			},
			{
				_id: '4',
				name: 'superhero',
				roles: ['0', '1', '3'],
				displayName: 'Schul-Cloud Admin',
				permissions: [
					'd', 'superhero', 'a', 'b', 'c', 'e', 'student', 'administrator', 'teacher1', 'teacher2',
				],
			},
		]);
	});
});

describe('addDisplayName', () => {
	it('should work for role names', () => {
		const result = addDisplayName({ name: 'teacher' });
		expect(result).to.deep.equal({
			name: 'teacher',
			displayName: 'Lehrer',
		});
	});

	it('should work for not matching role names', () => {
		const result = addDisplayName({ name: 'blub' });
		expect(result).to.deep.equal({
			name: 'blub',
			displayName: '',
		});
	});
});
