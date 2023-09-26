import { DemoSchoolResponse } from './demo-school.response';

describe(DemoSchoolResponse.name, () => {
	describe('when creating a demo school response that only contains one root entry', () => {
		it('should have basic properties defined', () => {
			const data = { id: 'anId', type: 'school', key: 'my School', children: [] };
			const response = new DemoSchoolResponse(data);
			expect(response.type).toEqual(data.type);
			expect(response.id).toEqual(data.id);
			expect(response.key).toEqual(data.key);
			expect(response.children).toEqual(data.children);
		});

		it('should map child entity information correctly', () => {
			const data = {
				id: 'anId',
				type: 'school',
				key: 'my School',
				children: [{ id: 'anOtherId', type: 'user', key: 'peter.pan@exampl.com', children: [] }],
			};
			const response = new DemoSchoolResponse(data);
			expect(response.type).toEqual(data.type);
			expect(response.id).toEqual(data.id);
			expect(response.key).toEqual(data.key);
			expect(response.children).toEqual(data.children);
		});
	});
});
