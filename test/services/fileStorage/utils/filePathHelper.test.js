const chai = require('chai');

const { expect } = chai;

const { BadRequest } = require('../../../../src/errors');
const {
	generateFileNameSuffix,
	whitelistFileName,
} = require('../../../../src/services/fileStorage/utils/filePathHelper');

describe('filePathHelper', () => {
	describe('when fileNames are whitelisted using whitelistFileName', () => {
		it('should keep alphanumeric characters', () => {
			const lowerCaseChars = 'abcdefghijklmnopqrstuvwxyz';
			const lowerCaseResult = whitelistFileName(lowerCaseChars);
			expect(lowerCaseResult).to.be.equal(lowerCaseChars);

			const numbers = '0123456789';
			const numbersResult = whitelistFileName(numbers);
			expect(numbersResult).to.be.equal(numbers);
		});

		it('should lowercase alphabetical characters', () => {
			const upperCaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
			const lowerCaseChars = 'abcdefghijklmnopqrstuvwxyz';
			const result = whitelistFileName(upperCaseChars);
			expect(result).to.be.equal(lowerCaseChars);
		});

		it('should keep allowed special chars', () => {
			const allowedSpecialChars = '-_.';
			const result = whitelistFileName(allowedSpecialChars);
			expect(result).to.be.equal(allowedSpecialChars);
		});

		it('should replace spaces with minus', () => {
			const spacedName = 'hello to the world';
			const result = whitelistFileName(spacedName);
			expect(result).to.be.equal('hello-to-the-world');
		});

		it('should replace all other characters from samples', () => {
			// url: slash and double-point with minus
			const urlResult = whitelistFileName('https://youtube.com:1234/watch.exe');
			expect(urlResult).to.be.equal('https-youtube.com-1234-watch.exe');
			// funny chars
			const allReplacedSample =
				'🴋🪭🔆🀚🮿🇍🅣🨚📟🻣🸴🇟📲🇧🇛🹨🞺😲🬦🌸🧖🅋🁍🔋📿🲣😿🳥🤞🶄🎙🺳🏶🌧🭤🯙🵉🍭🯌🍏🟋🍴🙈🬆🊥🕾🥁🙇🟿🊅🣑🦑🔩🯭🊳🀷🏮🞱🡆🧮🭹🅋🢣🚉🡓🣬🲥🚯🥳🡄🣒🝵🁜🻫🔿🨤🰎🏾🔠🖒🬦🆾🂻🥿🣜🧀🞞🜹🝲🵆🹸🈨🵩🢎🢀🳬🬡🻖🕘🃷🋢🔆🟠🀵🴴🂛🻪🕒🞠🫊🡃🭗🊫🫯💱🌟🋐🮽🥼🗑🔻😧🰳🡴🵊🇝🏎🶀🯠🫓🟀🹱🞊🅰🷅🋉🭊🶙🌟🸺🩊🏚🤻🹜🺡🌸🕇🔰🚑🦂🠒🇛🔢👌🁴🧖😔🷏🱻🇥😪🋱🡢🴘🞟🚂🅅🙸🟄🋵💓🍜🨒🲎🌌🰳🋙🱗🣋🏰🏂🖶🆤🙙🊳🩭🡑🞊🦼🛈🟕🛺🴵👠🟆🆾🺧🐌🇻🴻🼀🏔🫉🗀🸗🱐🛼🢔🦔😀🍍🶆🩴🨗🩼🹚🹯🤋😇🚾🐘🕝🨬🩞🉖📉🖢🡏🢡🴈🔰📁🸺🃐🪝🀘🨄🌜🺍🋽🱵🬪🖑🜐🮴🍕🐞😄🐒🜪🏉🕞🧽🚆🙲🸸🲈🁩🠜😜🣬🤪🏛🻮🤽🄴🻦🉳🯪🝜🥸🊚🦞🲫🟀🃄🇙🰗🃧👳🕧🋣🁬🮅🣅🪱🶡🦾🦕🚸💴🅊🢅🻃🮨🦦🯨🜖👁🞌';
			const allReplacedResult = whitelistFileName(allReplacedSample);
			expect(allReplacedResult).to.equal('-');
			// previous blacklist
			const replaceAllFromPrevoiusBlacklist = '\';:=#*+[]~<{\\()}>§$%&|^£@±?!"`□]';
			const replaceAllFromPrevoiusBlacklistResult = whitelistFileName(replaceAllFromPrevoiusBlacklist);
			expect(replaceAllFromPrevoiusBlacklistResult).to.equal('-');
		});

		it('should throw BadRequest when fileName is undefined', () => {
			expect(() => whitelistFileName(undefined)).to.throw(BadRequest);
		});

		it('should throw BadRequest when fileName is null', () => {
			expect(() => whitelistFileName(null)).to.throw(BadRequest);
		});

		it('should throw BadRequest when fileName is an empty string', () => {
			expect(() => whitelistFileName('')).to.throw(BadRequest);
		});

		it('should throw BadRequest when fileName is not a string', () => {
			expect(() => whitelistFileName(123)).to.throw(BadRequest);
			expect(() => whitelistFileName({ name: 'file.txt' })).to.throw(BadRequest);
			expect(() => whitelistFileName(['file.txt'])).to.throw(BadRequest);
		});
	});

	describe('when filenames are prefixed using generateFileNameSuffix', () => {
		it('should add current time stamp in front of filename', () => {
			const suffixedFileName = generateFileNameSuffix('sampleFileName.ext');
			const now = Date.now();
			const fileDateSuffix = suffixedFileName.split('-')[0]; // extract timestamp suffix
			const timestamp = Number.parseInt(fileDateSuffix, 10);
			expect(timestamp).to.be.a('number');
			const timespan = now - timestamp;
			expect(timespan, 'expect a small value, when filename generation just happened').to.be.a('number').lessThan(100);
		});
	});
});
