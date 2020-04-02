const { expect } = require('chai');

const {
	paginate,
	filterByQuery,
	addDisplayName,
	preparedRoles,
	unique,
} = require('../../../../src/services/role/utils');

describe('Role Service utils', async () => {
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
						'd', 'superhero', 'a', 'b', 'c', 'e', 'student', 'administrator', 'teacher1', 'teacher2'
					],
				},
			]);
		});
	});

	describe('unique', () => {
		it('should work', () => {
			const result = unique(['a', 'b', 'c'], ['b', 'c', 'd'], ['c', 'd', 'e']);
			expect(result).to.deep.equal(['a', 'b', 'c', 'd', 'e']);
		});

		it.skip('should work with undefined and null', () => {
			const result = unique(['a', 'b', 'c'], undefined, null);
			expect(result).to.deep.equal(['a', 'b', 'c']);
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

	describe('filterByQuery', () => {
		const array = [
			{ key: 0, value: 'a1', userId: ['123', '234', '456'] },
			{ key: 1, value: 'a2' },
			{ key: 2, value: 'a3' },
			{ key: 3, value: 'b1', userId: ['123'] },
			{ key: 4, value: 'b2' },
			{ key: 5, value: 'b3', userId: ['234'] },
		];

		it('should work without query', () => {
			const result = filterByQuery(array);
			expect(result).to.deep.equal(array);
		});

		it('should not touch $skip and $limit', () => {
			const result = filterByQuery(array, { $skip: 1, $limit: 3 });
			expect(result).to.deep.equal(array);
		});

		it('shift filter should work', () => {
			const result = filterByQuery(array, { userId: { $in: ['234', '123'] } });
			expect(result).to.deep.equal([
				{ key: 0, value: 'a1', userId: ['123', '234', '456'] },
				{ key: 3, value: 'b1', userId: ['123'] },
				{ key: 5, value: 'b3', userId: ['234'] },
			]);
		});

		it('regex filter should work', () => {
			const result = filterByQuery(array, { value: /a/i });
			expect(result).to.deep.equal([
				{ key: 0, value: 'a1', userId: ['123', '234', '456'] },
				{ key: 1, value: 'a2' },
				{ key: 2, value: 'a3' },
			]);
		});

		it('all together should work', () => {
			const result = filterByQuery(array, {
				$skip: 1,
				$limit: 3,
				value: /a/i,
				userId: { $in: ['123'] },
			});
			expect(result).to.deep.equal([
				{ key: 0, value: 'a1', userId: ['123', '234', '456'] },
			]);
		});
	});

	describe('paginate', () => {
		const array = [
			{ key: 0, value: 'a' },
			{ key: 1, value: 'a' },
			{ key: 2, value: 'a' },
			{ key: 3, value: 'b' },
			{ key: 4, value: 'b' },
			{ key: 5, value: 'b' },
		];

		it('should paginate it', () => {
			const result = paginate(array);
			expect(result).to.deep.equal({
				total: 6,
				limit: 6,
				skip: 0,
				data: array,
			});
		});

		it('limit should work for paginate', () => {
			const result = paginate(array, { $limit: 3 }, array.length);
			expect(result).to.deep.equal({
				total: 6,
				limit: 3,
				skip: 0,
				data: [
					{ key: 0, value: 'a' },
					{ key: 1, value: 'a' },
					{ key: 2, value: 'a' },
				],
			});
		});

		it('skip should work for paginate', () => {
			const result = paginate(array, { $skip: 3 }, array.length);
			expect(result).to.deep.equal({
				total: 6,
				limit: 6,
				skip: 3,
				data: [
					{ key: 3, value: 'b' },
					{ key: 4, value: 'b' },
					{ key: 5, value: 'b' },
				],
			});
		});

		it('skip and limit should work together for paginate', () => {
			const result = paginate(array, { $skip: 3, $limit: 2 }, array.length);
			expect(result).to.deep.equal({
				total: 6,
				limit: 2,
				skip: 3,
				data: [
					{ key: 3, value: 'b' },
					{ key: 4, value: 'b' },
				],
			});
		});

		it('already paginate results should pass', () => {
			const paginated = {
				total: 6,
				limit: 2,
				skip: 3,
				data: [
					{ key: 3, value: 'b' },
					{ key: 4, value: 'b' },
				],
			};

			const result = paginate(paginated, { $skip: 1, $limit: 4 }, array.length);
			expect(result).to.deep.equal(paginated);
		});

		it('undefined should paginate', () => {
			const result = paginate(undefined, { $skip: 1, $limit: 4 }, array.length);
			expect(result).to.deep.equal({
				total: 6,
				limit: 4,
				skip: 1,
				data: [],
			});
		});
	});
});
