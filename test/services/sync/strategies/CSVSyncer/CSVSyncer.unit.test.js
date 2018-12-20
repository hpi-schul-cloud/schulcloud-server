'use strict';

const chai = require('chai');
const expect = chai.expect;
const assert = require('assert');

const app = require('../../../../../src/app');
const Syncer = require('../../../../../src/services/sync/strategies/Syncer');
const CSVSyncer = require('../../../../../src/services/sync/strategies/CSVSyncer');

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

        it('should require firstName, lastName, and email', () => {
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

    describe('extractClassesToBeCreated method', () => {
        const expectResult = (params, expected) => {
            expect(new CSVSyncer().extractClassesToBeCreated(params)).to.deep.equal(expected);
        };

        it('should return an empty array if no records are given', () => {
            expectResult([], []);
        });

        it('should return all distinct class attribute values', () => {
            expectResult([
                {class: '1a'},
                {class: '12b'},
                {class: '12b'},
            ], ['1a', '12b']);
        });

        it('should ignore empty class attribute values', () => {
            expectResult([
                {class: ''},
                {class: '12b'},
                {class: '12b'},
            ], ['12b']);
        });

        it('should work on composite class attribute values', () => {
            expectResult([
                {class: '1a+1b'},
                {class: '1c'},
            ], ['1a', '1b', '1c']);
            expectResult([
                {class: '1a+1b'},
                {class: '1b+1a'},
            ], ['1a', '1b']);
            expectResult([
                {class: '1a+1b+1b+1b'},
                {class: '1b+1a'},
            ], ['1a', '1b']);
        });
    });

    describe('getClassObject method', () => {
        it('should default to the `static` scheme', async () => {
            const result = await new CSVSyncer().getClassObject('foobar');
            expect(result.nameFormat).to.equal('static');
            expect(result.name).to.equal('foobar');
        });

        it('should split classes and grade levels if applicable', async () => {
            const result = await new CSVSyncer(app).getClassObject('1a');
            expect(result.nameFormat).to.equal('gradeLevel+name');
            expect(result.gradeLevel.name).to.equal('1');
            expect(result.name).to.equal('a');
        });

        it('should only use grade levels for 1. to 13. grade', async () => {
            for (let i = -5; i <= 20; i++) {
                const result = await new CSVSyncer(app).getClassObject(`${i}b`);
                if (i >= 1 && i <= 13) {
                    expect(result.nameFormat).to.equal('gradeLevel+name');
                    expect(result.gradeLevel.name).to.equal(String(i));
                    expect(result.name).to.equal('b');
                } else {
                    expect(result.nameFormat).to.equal('static');
                    expect(result.name).to.equal(`${i}b`);
                }
            }
        });

        it('should trim leading zeros for grade levels', async () => {
            for (let input of ['02a', '05b', '09c', '012d', '007e', '0000010f']) {
                const result = await new CSVSyncer(app).getClassObject(input);
                expect(result.nameFormat).to.equal('gradeLevel+name');
                expect(result.gradeLevel.name).to.equal(input.match(/^0*(\d+)./)[1]);
                expect(result.name).to.equal(input.replace(/\d*/, ''));
            }
        });
    });
});
