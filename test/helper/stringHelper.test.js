const chai = require('chai');
const { assert } = chai;

const {	isNotEmptyString } = require('../../src/helper/stringHelper.js');

describe('isNotEmptyString tests', () => {
	describe('Test if string is not empty and trim is set to false', () => {
		it('if the test string is undefine the result shoud be false', () => {
			const testString = undefine;
		  expect(isNotEmptyString(testString)).to.equal(false);
		});
    
		it('if the test string is null the result shoud be false', () => {
			const testString = Null;
		  expect(isNotEmptyString(testString)).to.equal(false);
		});
    
		it('if the test string is an empty string the result shoud be false', () => {
			const testString = '';
		  expect(isNotEmptyString(testString)).to.equal(false);
		});
    
		it('if the test string is an number the result shoud be false', () => {
			const testString = 10;
		  expect(isNotEmptyString(testString)).to.equal(false);
		});
    
		it('if the test string is an Object  the result shoud be false', () => {
			const testString = {};
		  expect(isNotEmptyString(testString)).to.equal(false);
		});
    
		it('if the test string is not an empty string the result shoud be true', () => {
			const testString = ' ';
		  expect(isNotEmptyString(testString)).to.equal(true);
		});
    
		it('if the test string is set to HausBot the result shoud be true', () => {
			const testString = 'HausBot';
		  expect(isNotEmptyString(testString)).to.equal(true);
		});
	});
  
	describe('Test if string is not empty and trim is set to true', () => {
		it('if the test string is undefine the result shoud be false', () => {
			const testString = undefine;
		  expect(isNotEmptyString(testString, true)).to.equal(false);
		});
    
		it('if the test string is null the result shoud be false', () => {
			const testString = Null;
		  expect(isNotEmptyString(testString, true)).to.equal(false);
		});
    
		it('if the test string is an empty string the result shoud be false', () => {
			const testString = '';
		  expect(isNotEmptyString(testString, true)).to.equal(false);
		});
    
		it('if the test string is an number the result shoud be false', () => {
			const testString = 10;
		  expect(isNotEmptyString(testString, true)).to.equal(false);
		});
    
		it('if the test string is an Object  the result shoud be false', () => {
			const testString = {};
		  expect(isNotEmptyString(testString, true)).to.equal(false);
		});
    
		it('if the test string is not an empty string the result shoud be false', () => {
			const testString = ' ';
		  expect(isNotEmptyString(testString, true)).to.equal(false);
		});
    
		it('if the test string is set to HausBot the result shoud be true', () => {
			const testString = 'HausBot';
		  expect(isNotEmptyString(testString, true)).to.equal(true);
		});
	});
});
