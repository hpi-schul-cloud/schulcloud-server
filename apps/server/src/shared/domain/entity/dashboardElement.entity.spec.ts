import { GridElement } from './dashboard.entity';

const gridReference = {
	getMetadata: () => ({
		id: 'someId',
		title: 'Calendar-Dashboard',
		shortTitle: 'CAL',
		displayColor: '#FFFFFF',
	}),
};

describe('dashboardElement', () => {
	describe('isGroup', () => {
		it('element with single reference should not be a group', () => {
			const dashboardElement = new GridElement('id', gridReference);

			expect(dashboardElement.isGroup()).toEqual(false);
		});

		it.todo('element with multiple references should be a group');
	});

	describe('getMetadata', () => {
		it.todo('');
	});
});
