const chai = require('chai');
const { Types } = require('mongoose');

const { assert } = chai;

const compare = require('../../src/helper/compare');

describe('Comparator Library for', () => {
	describe('ObjectId\'s', () => {
		const sampleId = new Types.ObjectId();
		it('requires at least two parameters given', () => {
			assert.throws(compare.ObjectId.equal.bind(), 'could not compare less than two id\'s');
			assert.throws(compare.ObjectId.equal.bind(new Types.ObjectId()), 'could not compare less than two id\'s');
			assert.isFalse(compare.ObjectId.equal(new Types.ObjectId(), new Types.ObjectId()),
				'new ids should not be euqual');
			assert.isFalse(compare.ObjectId.equal(new Types.ObjectId(), new Types.ObjectId(), new Types.ObjectId()),
				'new ids should not be euqual');
		});
		it('returns false for different ids', () => {
			assert.isFalse(compare.ObjectId.equal(new Types.ObjectId(), new Types.ObjectId()));
			assert.isFalse(compare.ObjectId.equal(new Types.ObjectId(), new Types.ObjectId(), new Types.ObjectId()));
			assert.isFalse(compare.ObjectId.equal(
				new Types.ObjectId(),
				new Types.ObjectId(),
				new Types.ObjectId(),
				new Types.ObjectId(),
			));
		});
		it('returns true for same ids', () => {
			assert.isTrue(compare.ObjectId.equal(sampleId, sampleId));
			assert.isTrue(compare.ObjectId.equal(sampleId, sampleId, sampleId));
			assert.isTrue(compare.ObjectId.equal(sampleId, sampleId, sampleId, sampleId));
		});
		it('allows string and object ids to be mixed', () => {
			assert.isTrue(compare.ObjectId.equal(sampleId, String(sampleId)));
			assert.isTrue(compare.ObjectId.equal(sampleId, String(sampleId), new Types.ObjectId(String(sampleId))));
		});
		it('return false for unconventional input', () => {
			assert.isFalse(compare.ObjectId.equal(null, null));
			assert.isFalse(compare.ObjectId.equal(undefined, undefined));
			assert.isFalse(compare.ObjectId.equal(null, undefined));
			assert.isFalse(compare.ObjectId.equal({}, {}));
			assert.isFalse(compare.ObjectId.equal(null, {}));
			assert.isFalse(compare.ObjectId.equal('', {}));
		});
	});
});
