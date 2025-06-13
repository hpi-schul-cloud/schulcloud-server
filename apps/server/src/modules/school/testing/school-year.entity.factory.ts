import { BaseFactory } from '@testing/factory/base.factory';
import { SchoolYearEntity, SchoolYearProperties } from '../repo';

type SchoolYearTransientParams = {
	startYear: number;
};

class SchoolYearFactory extends BaseFactory<SchoolYearEntity, SchoolYearProperties, SchoolYearTransientParams> {
	public withStartYear(startYear: number): this {
		this.rewindSequence();
		return this.transient({ startYear });
	}
}

export const schoolYearEntityFactory = SchoolYearFactory.define(SchoolYearEntity, ({ transientParams, sequence }) => {
	const now = new Date();
	const startYearWithoutSequence = transientParams?.startYear ?? now.getFullYear();
	const sequenceStartingWithZero = sequence - 1;
	let correction = 0;

	if (now.getMonth() < 7 && !transientParams?.startYear) {
		correction = 1;
	}

	const startYear = startYearWithoutSequence + sequenceStartingWithZero - correction;

	const name = `${startYear}/${(startYear + 1).toString().slice(-2)}`;
	const startDate = new Date(`${startYear}-08-01`);
	const endDate = new Date(`${startYear + 1}-07-31`);
	const courseCreationInNextYear = false;

	return { name, startDate, endDate, courseCreationInNextYear };
});
