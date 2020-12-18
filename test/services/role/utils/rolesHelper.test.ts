import { expect } from 'chai';

import { sortRoles } from '../../../../src/services/role/utils/rolesHelper';

const testData = [
	{
		_id: '5bb5c190fb457b1c3c0c7e0f',
		roles: [],
	},
	{
		_id: '5bb5c391fb457b1c3c0c7e10',
		roles: [],
	},
	{
		_id: '5bb5c49efb457b1c3c0c7e11',
		roles: ['5bb5c190fb457b1c3c0c7e0f'],
	},
	{
		_id: '5bb5c62bfb457b1c3c0c7e14',
		roles: ['5bb5c545fb457b1c3c0c7e13'],
	},
	{
		_id: '5bb5c545fb457b1c3c0c7e13',
		roles: ['5bb5c49efb457b1c3c0c7e11'],
	},
];

describe('rolesHelper should', () => {
	it('sort roles correctly', () => {
		const result = sortRoles(testData);

		const expected = [
			[
				{
					_id: '5bb5c190fb457b1c3c0c7e0f',
					roles: [],
				},
				{
					_id: '5bb5c391fb457b1c3c0c7e10',
					roles: [],
				},
			],
			[
				{
					_id: '5bb5c49efb457b1c3c0c7e11',
					roles: ['5bb5c190fb457b1c3c0c7e0f'],
				},
			],
			[
				{
					_id: '5bb5c545fb457b1c3c0c7e13',
					roles: ['5bb5c49efb457b1c3c0c7e11'],
				},
			],
			[
				{
					_id: '5bb5c62bfb457b1c3c0c7e14',
					roles: ['5bb5c545fb457b1c3c0c7e13'],
				},
			],
		];

		expect(result).to.have.lengthOf(4);
		expect(result).to.eql(expected);
	});
});
