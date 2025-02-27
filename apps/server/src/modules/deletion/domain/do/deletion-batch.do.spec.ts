import { BatchStatus, DomainName } from '../types';
import { DeletionBatch, DeletionBatchProps } from './deletion-batch.do';

describe(DeletionBatch.name, () => {
	const setup = () => {
		const props: DeletionBatchProps = {
			id: '0000d224816abba584714c9c',
			name: 'name',
			status: BatchStatus.CREATED,
			targetRefDomain: DomainName.USER,
			targetRefIds: ['0000d224816abba584714c9c'],
			invalidIds: [],
			skippedIds: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const deletionBatch = new DeletionBatch(props);

		return { deletionBatch, props };
	};

	it('should create an instance of DeletionBatch', () => {
		const { deletionBatch } = setup();

		expect(deletionBatch).toBeInstanceOf(DeletionBatch);
	});

	it('should return the props', () => {
		const { deletionBatch, props } = setup();

		expect(deletionBatch.getProps()).toEqual(props);
	});
});
