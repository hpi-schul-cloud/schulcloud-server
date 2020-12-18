import { expect } from 'chai';
import { makeStringRCConform } from '../../../src/services/rocketChat/helpers';

describe('makeStringRCConform', () => {
	it('replaces german umlaute', () => {
		expect(makeStringRCConform('öÖüÜäÄß')).to.equal('oeOeueUeaeAess');
	});

	it('replaces spaces', () => {
		expect(makeStringRCConform('two words')).to.equal('two-words');
	});

	it('replaces special characters', () => {
		expect(makeStringRCConform('?!"\'\\[]()´*+´§$%&/=,;:^°')).to.equal('________________________');
	});

	it('does not replace normal chars or numbers', () => {
		expect(makeStringRCConform('LoremIpsum0815')).to.equal('LoremIpsum0815');
	});

	it('does not replace allowed sepcial characters', () => {
		expect(makeStringRCConform('.-_')).to.equal('.-_');
	});
});
