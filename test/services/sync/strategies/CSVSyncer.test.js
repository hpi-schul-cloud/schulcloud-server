'use strict';

const chai = require('chai');
const expect = chai.expect;
const assert = require('assert');

const Syncer = require('../../../../src/services/sync/strategies/Syncer');
const CSVSyncer = require('../../../../src/services/sync/strategies/CSVSyncer');

describe('CSVSyncer', () => {
	it('works', () => {
        return new CSVSyncer();
    });

    it('implements the Syncer interface', () => {
        expect(Object.getPrototypeOf(CSVSyncer)).to.equal(Syncer);
    });

    describe('parseCsvData', () => {
        it('should fail for empty data', () => {
            const out = new CSVSyncer();
            out.csvData = '';
            try {
                out.parseCsvData();
            } catch (err) {
                expect(err.message).to.equal('No input data');
            }
        });

        it('should fail if only a header is given', () => {
            const out = new CSVSyncer();
            out.csvData = 'firstName,lastName,email,class\n';
            try {
                out.parseCsvData();
            } catch (err) {
                expect(err.message).to.equal('No input data');
            }
        });

        it('should require firstNam, lastName, and email', () => {
            const out = new CSVSyncer();
            out.csvData = 'firstName,lastName,Emil\n1,2,3';
            try {
                out.parseCsvData();
                assert.fail();
            } catch (err) {
                expect(err.message).to.equal('Parsing failed. Expected attribute "email"');
            }
        });

        it('should work with all required arguments', () => {
            const out = new CSVSyncer();
            out.csvData = 'firstName,lastName,email\n1,2,3';
            const result = out.parseCsvData();
            expect(result).to.exist;
        });

        it('should support the optional class attribute', () => {
            const out = new CSVSyncer();
            out.csvData = 'firstName,lastName,email,class\n1,2,test,4a';
            const result = out.parseCsvData();
            expect(out.importClasses).to.be.true;
            expect(result).to.exist;
            expect(result[0].class).to.equal('4a');
        });

        it('should support importing records with incomplete class data', () => {
            const out = new CSVSyncer();
            out.csvData = [
                'firstName,lastName,email,class',
                'test,testington,test@example.org,1a',
                'toast,testington,toast@example.org,',
                'foo,bar,baz@gmail.com,2b',
            ].join('\n');
            const result = out.parseCsvData();
            expect(out.importClasses).to.be.true;
            expect(result).to.exist;
            expect(result[0].class).to.equal('1a');
            expect(result[1].class).to.equal('');
            expect(result[2].class).to.equal('2b');
        });
    });
});
