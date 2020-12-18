import { expect } from 'chai';
import {
	convertSelect,
	createMultiDocumentAggregation,
	getParentReducer,
} from '../../../../src/services/user/utils/aggregations';

describe('consent aggregation', () => {
	it('convert select', () => {
		const selectArray = ['affe', 'tanz', 'schwein'];
		const converted = convertSelect(selectArray);
		expect(converted).to.deep.equal({
			affe: 1,
			tanz: 1,
			schwein: 1,
		});
	});

	it('get parent reducer', () => {
		const variable = 'termsOfUse';
		const reducer = getParentReducer(variable);
		expect(reducer).to.deep.equal({
			$reduce: {
				input: '$consent.parentConsents',
				initialValue: false,
				in: { $or: ['$$value', `$$this.${variable}`] },
			},
		});
	});

	it('sortable without selcting sorted values', () => {
		const aggregation = createMultiDocumentAggregation({
			select: ['firstname'],
			sort: {
				consentStatus: 1,
				lastname: -1,
			},
		});

		let sortAggregation;
		let statusAggregation;
		let selectAggregation;

		aggregation.forEach((agg) => {
			if ({}.hasOwnProperty.call(agg, '$project')) {
				if (!statusAggregation) statusAggregation = agg;
				else if (!selectAggregation) selectAggregation = agg;
			} else if ({}.hasOwnProperty.call(agg, '$sort')) {
				sortAggregation = agg;
			}
		});

		expect(statusAggregation).to.have.nested.property('$project.consentStatus');
		expect(statusAggregation).to.have.nested.property('$project.lastname');
		expect(statusAggregation).to.have.nested.property('$project.firstname');

		expect(sortAggregation).to.have.nested.include({ '$sort.consentSortParam': 1 });
		expect(sortAggregation).to.have.nested.include({ '$sort.lastname': -1 });

		expect(selectAggregation).to.have.nested.include({ '$project.firstname': 1 });
	});
});
