import { BaseFactory } from '@shared/testing';
import { ObjectId } from 'bson';
import { SchoolYear, SchoolYearProps } from '../do';

type SchoolYearTransientParams = {
	startYear: number;
};

class SchoolYearFactory extends BaseFactory<SchoolYear, SchoolYearProps, SchoolYearTransientParams> {
	public withStartYear(startYear: number): this {
		this.rewindSequence();
		return this.transient({ startYear });
	}
}

export const schoolYearFactory = SchoolYearFactory.define(SchoolYear, ({ transientParams, sequence }) => {
	const id = new ObjectId().toHexString();

	const startYearWithoutSequence = transientParams?.startYear ?? new Date().getFullYear();
	const startYear = startYearWithoutSequence + sequence - 1;

	const name = `${startYear}/${(startYear + 1).toString().slice(-2)}`;
	const startDate = new Date(`${startYear}-08-01`);
	const endDate = new Date(`${startYear + 1}-07-31`);

	return { id, name, startDate, endDate };
});
