const { expect } = require('chai');
const assert = require('assert');

const CSVSyncer = require('../../../../../src/services/sync/strategies/CSVSyncer');

describe('CSVSyncer', () => {
	it('works', () => new CSVSyncer());

	it('implements the Syncer interface', () => {
		expect(CSVSyncer.params).to.not.equal(undefined);
		expect(CSVSyncer.respondsTo).to.not.equal(undefined);
		expect(CSVSyncer.aggregateStats).to.not.equal(undefined);
		expect(new CSVSyncer().steps).to.not.equal(undefined);
		expect(new CSVSyncer().sync).to.not.equal(undefined);

		expect(CSVSyncer.dateValidator).to.not.equal(undefined);
		expect(CSVSyncer.stringToDateConverter).to.not.equal(undefined);
	});

	describe('parseCsvData', () => {
		it('should fail for empty data', () => {
			const out = new CSVSyncer();
			out.options.csvData = '';
			try {
				out.parseCsvData();
			} catch (err) {
				expect(err.message).to.equal('No input data');
			}
		});

		it('should fail if only a header is given', () => {
			const out = new CSVSyncer();
			out.options.csvData = 'firstName,lastName,email,class\n';
			try {
				out.parseCsvData();
			} catch (err) {
				expect(err.message).to.equal('No input data');
			}
		});

		it('should require firstName, lastName, and email', () => {
			const out = new CSVSyncer();
			out.options.csvData = 'firstName,lastName,Emil\n1,2,3';
			try {
				out.parseCsvData();
				assert.fail();
			} catch (err) {
				expect(err.message).to.equal('Parsing failed. Expected attribute "email"');
			}
		});

		it('should work with all required arguments', () => {
			const out = new CSVSyncer();
			out.options.csvData = 'firstName,lastName,email\n1,2,3';
			const result = out.parseCsvData();
			expect(result).to.not.equal(undefined);
		});

		it('should support the optional class attribute', () => {
			const out = new CSVSyncer();
			out.options.csvData = 'firstName,lastName,email,class\n1,2,test,4a';
			const result = out.parseCsvData();
			expect(result).to.not.equal(undefined);
			expect(result[0].class).to.equal('4a');
		});

		it('should support importing records with incomplete class data', () => {
			const out = new CSVSyncer();
			out.options.csvData = [
				'firstName,lastName,email,class',
				'test,testington,test@example.org,1a',
				'toast,testington,toast@example.org,',
				'foo,bar,baz@gmail.com,2b',
			].join('\n');
			const result = out.parseCsvData();
			expect(result).to.not.equal(undefined);
			expect(result[0].class).to.equal('1a');
			expect(result[1].class).to.equal('');
			expect(result[2].class).to.equal('2b');
		});

		it('should not accept unvalid dates as user birthday', () => {
			const falsyValues = [false, null, undefined, '', 0]
			const misfitValues = [Symbol(), [], {}, true]
			const wrongFormatDates = ['32.12.2000', '01.13.2000', '01.01-2000', '01/01.2000', '01-01/2000', '42', 'void']
			const correctFormatDates = ['01.01.2000', '01-01-2000', '01/01/2000']

			const result0 = falsyValues.map(f => CSVSyncer.dateValidator(f))
			const result1 = misfitValues.map(m => CSVSyncer.dateValidator(m))
			const result2 = wrongFormatDates.map(w => CSVSyncer.dateValidator(w))
			const result3 = correctFormatDates.map(c => CSVSyncer.dateValidator(c))

			result0.forEach(r => expect(r).to.be.equal('missing birthday value'))
			result1.forEach(r => expect(r).to.be.equal('incorrect values, birthday must be a string'))
			result2.forEach(r => expect(r).to.be.equal('incorrect format. Birthday must be dd.mm.yyyy or dd/mm/yyyy or dd-mm-yyyy'))
			result3.forEach(r => expect(r).to.be.equal(false))
		});

	});
});
