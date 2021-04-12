const { expect } = require('chai');

const { classObjectFromName } = require('../../../../src/services/user-group/logic/classes');

describe('classes logic module', () => {
	describe('#classObjectFromName', () => {
		it('should default to the `static` scheme', async () => {
			const result = await classObjectFromName('foobar');
			expect(result.gradeLevel).to.be.undefined;
			expect(result.name).to.equal('foobar');
		});

		it('should split classes and grade levels if applicable', async () => {
			const result = await classObjectFromName('1a');
			expect(result.gradeLevel).to.equal('1');
			expect(result.name).to.equal('a');
		});

		it('should only use grade levels for 1. to 13. grade', async () => {
			for (let i = -5; i <= 20; i += 1) {
				const result = await classObjectFromName(`${i}b`);
				if (i >= 1 && i <= 13) {
					expect(result.gradeLevel).to.equal(String(i));
					expect(result.name).to.equal('b');
				} else {
					expect(result.gradeLevel).to.be.undefined;
					expect(result.name).to.equal(`${i}b`);
				}
			}
		});

		it('should trim leading zeros for grade levels', async () => {
			await Promise.all(
				['02a', '05b', '09c', '012d', '007e', '0000010f'].map(async (input) => {
					const result = await classObjectFromName(input);
					expect(result.gradeLevel).to.equal(input.match(/^0*(\d+)./)[1]);
					expect(result.name).to.equal(input.replace(/\d*/, ''));
				})
			);
		});

		it('should optionally include a schoolId in the result', async () => {
			const schoolId = '42';
			const result = await classObjectFromName('2c', { schoolId });
			expect(result.gradeLevel).to.equal('2');
			expect(result.name).to.equal('c');
			expect(result.schoolId).to.equal(schoolId);
		});

		it('should optionally include a school year in the result', async () => {
			const year = 'a year id';
			const result = await classObjectFromName('2c', { year });
			expect(result.gradeLevel).to.equal('2');
			expect(result.name).to.equal('c');
			expect(result.year).to.equal(year);
		});

		it('should not accept different name attributes', async () => {
			const result = await classObjectFromName('4e', { gradeLevel: '5', name: 'f' });
			expect(result.gradeLevel).to.equal('4');
			expect(result.name).to.equal('e');
		});
	});
});
