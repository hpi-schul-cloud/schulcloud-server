import { ISchoolYearProperties, SchoolYear } from '@shared/domain/entity/schoolyear.entity';
import { BaseFactory } from './base.factory';

export const schoolYearFactory = BaseFactory.define<SchoolYear, ISchoolYearProperties>(SchoolYear, () => {
	const year = new Date(2020, 1).getFullYear();
	const nextYear = (year + 1).toString().substr(-2);
	const name = `${year}/${nextYear}`;
	const startDate = new Date(`${year}-08-01`);
	const endDate = new Date(`${year + 1}-07-31`);
	return { name, startDate, endDate };
});
