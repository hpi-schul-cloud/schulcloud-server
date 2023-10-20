import { DoBaseFactory } from '@shared/testing';
import { ObjectId } from 'bson';
import { SchoolYear, SchoolYearProps } from '../domain';

export const schoolYearFactory = DoBaseFactory.define<SchoolYear, SchoolYearProps>(SchoolYear, () => {
	const id = new ObjectId().toHexString();
	const year = new Date().getFullYear();
	const nextYear = (year + 1).toString().substr(-2);
	const name = `${year}/${nextYear}`;
	const startDate = new Date(`${year}-08-01`);
	const endDate = new Date(`${year + 1}-07-31`);

	return { id, name, startDate, endDate };
});
