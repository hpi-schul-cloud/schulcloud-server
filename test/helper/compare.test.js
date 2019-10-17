const chai = require('chai');
const { Types } = require('mongoose');

const { assert } = chai;

const compare = require('../../src/helper/compare');

describe('Comparator Library for', () => {
	describe('ObjectId\'s', () => {
		const sampleId = new Types.ObjectId();
		it('requires at least two parameters given', () => {
			assert.throws(compare.ObjectId.Equal.bind(), 'could not compare less than two id\'s');
			assert.throws(compare.ObjectId.Equal.bind(new Types.ObjectId()), 'could not compare less than two id\'s');
			assert.isFalse(compare.ObjectId.Equal(new Types.ObjectId(), new Types.ObjectId()),
				'new ids should not be euqual');
			assert.isFalse(compare.ObjectId.Equal(new Types.ObjectId(), new Types.ObjectId(), new Types.ObjectId()),
				'new ids should not be euqual');
		});
		it('returns false for different ids', () => {
			assert.isFalse(compare.ObjectId.Equal(new Types.ObjectId(), new Types.ObjectId()));
			assert.isFalse(compare.ObjectId.Equal(new Types.ObjectId(), new Types.ObjectId(), new Types.ObjectId()));
			assert.isFalse(compare.ObjectId.Equal(
				new Types.ObjectId(),
				new Types.ObjectId(),
				new Types.ObjectId(),
				new Types.ObjectId(),
			));
		});
		it('returns true for same ids', () => {
			assert.isTrue(compare.ObjectId.Equal(sampleId, sampleId));
			assert.isTrue(compare.ObjectId.Equal(sampleId, sampleId, sampleId));
			assert.isTrue(compare.ObjectId.Equal(sampleId, sampleId, sampleId, sampleId));
		});
		it('allows string and object ids to be mixed', () => {
			assert.isTrue(compare.ObjectId.Equal(sampleId, String(sampleId)));
			assert.isTrue(compare.ObjectId.Equal(sampleId, String(sampleId), new Types.ObjectId(String(sampleId))));
		});
	});
});
