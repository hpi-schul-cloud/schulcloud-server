import { School } from '../entity/school.entity';

export const schoolFactory = {
	build: (props?: { name?: string }): School => {
		const school = new School({
			name: 'school #1',
			...props,
		});
		return school;
	},
};
