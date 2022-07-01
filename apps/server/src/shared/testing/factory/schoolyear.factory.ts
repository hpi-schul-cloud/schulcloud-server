import { ISchoolYear, SchoolYear } from '@shared/domain/entity/schoolyear.entity';
import { BaseFactory } from './base.factory';

export const schoolYearFactory = BaseFactory.define<SchoolYear, ISchoolYear>(SchoolYear, () => {
	const year = new Date().getFullYear();
	const nextYear = (year + 1).toString().substr(-2);
	const name = `${year}/${nextYear}`;
	const startDate = new Date(`${year}-07-31`);
	const endDate = new Date(`${year + 1}-08-01`);
	return { name, startDate, endDate };
});
