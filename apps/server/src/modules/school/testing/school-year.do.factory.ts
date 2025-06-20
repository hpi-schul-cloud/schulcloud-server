import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { SchoolYear, SchoolYearProps } from '../domain';

type SchoolYearTransientParams = {
	startYear: number;
};

class SchoolYearDoFactory extends BaseFactory<SchoolYear, SchoolYearProps, SchoolYearTransientParams> {
	public withStartYear(startYear: number): this {
		this.rewindSequence();
		return this.transient({ startYear });
	}
}

export const schoolYearDoFactory = SchoolYearDoFactory.define(SchoolYear, ({ transientParams, sequence }) => {
	const id = new ObjectId().toHexString();

	const now = new Date();
	const startYearWithoutSequence = transientParams?.startYear ?? now.getFullYear();
	const sequenceStartingWithZero = sequence - 1;
	let correction = 0;

	if (now.getMonth() < 7 && !transientParams?.startYear) {
		correction = 1;
	}

	const startYear = startYearWithoutSequence + sequenceStartingWithZero - correction;
	const courseCreationInNextYear = false;
	const name = `${startYear}/${(startYear + 1).toString().slice(-2)}`;
	const startDate = new Date(`${startYear}-08-01`);
	const endDate = new Date(`${startYear + 1}-07-31`);

	return { id, name, startDate, endDate, courseCreationInNextYear };
});
