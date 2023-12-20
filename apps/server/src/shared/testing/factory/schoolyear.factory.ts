import { SchoolYearEntity, SchoolYearProperties } from '@shared/domain/entity/schoolyear.entity';
import { BaseFactory } from './base.factory';

type SchoolYearTransientParams = {
	startYear: number;
};

class SchoolYearFactory extends BaseFactory<SchoolYearEntity, SchoolYearProperties, SchoolYearTransientParams> {
	public withStartYear(startYear: number): this {
		this.rewindSequence();
		return this.transient({ startYear });
	}
}

export const schoolYearFactory = SchoolYearFactory.define(SchoolYearEntity, ({ transientParams, sequence }) => {
	const startYearWithoutSequence = transientParams?.startYear ?? new Date().getFullYear();
	const startYear = startYearWithoutSequence + sequence - 1;

	const name = `${startYear}/${(startYear + 1).toString().slice(-2)}`;
	const startDate = new Date(`${startYear}-08-01`);
	const endDate = new Date(`${startYear + 1}-07-31`);

	return { name, startDate, endDate };
});
