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

		it('should not accept falsy valus as dates for user birthday', () => {
			const falsyValues = [false, null, undefined, '', 0];
			const out = new CSVSyncer();
			const { errors } = out.stats;
			falsyValues.forEach((f) => out.assertDateFormat(f));
			errors.forEach((r) => expect(r.message).to.be.equal('Kein Wert für das Geburtstagsdatum'));
		});
		it('should not accept strange values as dates for user birthday', () => {
			const out = new CSVSyncer();
			const { errors } = out.stats;
			const misfitValues = [Symbol('42'), [], {}, true];
			misfitValues.forEach((m) => out.assertDateFormat(m));
			errors.forEach((r) => expect(r.message).to.be.equal('Falscher Wert für Datum. Muss String sein'));
		});
		it('should not accept invalid date format as user birthday', () => {
			const out = new CSVSyncer();
			const { errors } = out.stats;
			const wrongFormatDates = [
				'32.12.2000', '01.13.2000', '01.01-2000', '01/01.2000', '01-01/2000', '42', 'void'];
			wrongFormatDates.forEach((w) => out.assertDateFormat(w));
			errors.forEach((r) => expect(r.message).to.be.equal(
				'Falsches Format. Muss sein dd.mm.yyyy oder dd/mm/yyyy oder dd-mm-yyyy'));
		});
		it('should return false when given correct value', () => {
			const out = new CSVSyncer();
			const { errors } = out.stats;
			const correctFormatDates = ['01.01.2000', '01-01-2000', '01/01/2000'];
			correctFormatDates.forEach((c) => out.assertDateFormat(c));
			expect(errors.length).to.be.equal(0);
		});
	});
});
