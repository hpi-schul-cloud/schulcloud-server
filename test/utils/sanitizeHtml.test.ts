import { expect } from 'chai';

import { sanitizeDeep } from '../../src/utils/sanitizeHtml';

describe('[utils] sanitizeDeep', () => {
	it('onload should destructor', () => {
		const input = {
			key: '" onmouseover=alert(document.cookie)       //;&gt;/',
		};
		const output = {
			key: '“ onmouseover=alert(document.cookie)       //;&gt;/',
		};
		expect(sanitizeDeep(input)).to.eql(output);
	});

	it('ONLOAD should destructor', () => {
		const input = {
			key: '" ONLOAD=alert(document.cookie)       //;&gt;/',
		};
		const output = {
			key: '“ ONLOAD=alert(document.cookie)       //;&gt;/',
		};
		expect(sanitizeDeep(input)).to.eql(output);
	});

	it('onreload should destructor', () => {
		const input = {
			key: '" onreload=alert(document.cookie)       //;&gt;/',
		};
		const output = {
			key: '“ onreload=alert(document.cookie)       //;&gt;/',
		};
		expect(sanitizeDeep(input)).to.eql(output);
	});

	it('ONRELOAD should destructor', () => {
		const input = {
			key: '" ONRELOAD=alert(document.cookie)       //;&gt;/',
		};
		const output = {
			key: '“ ONRELOAD=alert(document.cookie)       //;&gt;/',
		};
		expect(sanitizeDeep(input)).to.eql(output);
	});

	it('onmouseover should destructor', () => {
		const input = {
			key: '" onmouseover=alert(document.cookie)       //;&gt;/',
		};
		const output = {
			key: '“ onmouseover=alert(document.cookie)       //;&gt;/',
		};
		expect(sanitizeDeep(input)).to.eql(output);
	});

	it('ONMOUSEOVER should destructor', () => {
		const input = {
			key: '" ONMOUSEOVER=alert(document.cookie)       //;&gt;/',
		};
		const output = {
			key: '“ ONMOUSEOVER=alert(document.cookie)       //;&gt;/',
		};
		expect(sanitizeDeep(input)).to.eql(output);
	});

	it('on js functions should destructor for deep objects', () => {
		const input = {
			deep1: {
				deep2: {
					key: '" onload=alert(document.cookie)       //;&gt;/',
				},
			},
		};
		const output = {
			deep1: {
				deep2: {
					key: '“ onload=alert(document.cookie)       //;&gt;/',
				},
			},
		};
		expect(sanitizeDeep(input)).to.eql(output);
	});
	// = => htmlCode => &#61; | uniCode => U+003D
	it('on js functions should destructor for = as html code', () => {
		const input = {
			key: '" onmouseover&#61;alert(document.cookie)       //;&gt;/',
		};
		const output = {
			key: '" onmouseover=alert(document.cookie)       //;&gt;/',
		};
		expect(sanitizeDeep(input)).to.eql(output);
	});

	it('on js functions should destructor for = as unicode code', () => {
		const input = {
			key: '" onmouseoverU+003Dalert(document.cookie)       //;&gt;/',
		};
		const output = {
			key: '" onmouseoverU+003Dalert(document.cookie)       //;&gt;/',
		};
		expect(sanitizeDeep(input)).to.eql(output);
	});

	// \ => htmlCode => &#92; | uniCode => U+005C
	it('on js functions should destructor for = in as html code with html backslash', () => {
		const input = {
			key: '" onmouseover&#92;&#61;alert(document.cookie)       //;&gt;/',
		};
		const output = {
			key: '" onmouseover\\=alert(document.cookie)       //;&gt;/',
		};
		expect(sanitizeDeep(input)).to.eql(output);
	});

	it('on js functions should destructor for = in as html code with unicode backslash', () => {
		const input = {
			key: '" onmouseoverU+005C&#61;alert(document.cookie)       //;&gt;/',
		};
		const output = {
			key: '" onmouseoverU+005C=alert(document.cookie)       //;&gt;/',
		};
		expect(sanitizeDeep(input)).to.eql(output);
	});

	// / => htmlCode => &#47; | uniCode => U+002F
	it('on js functions should destructor for = in as html code with html slash', () => {
		const input = {
			key: '" onmouseover&#47;&#61;alert(document.cookie)       //;&gt;/',
		};
		const output = {
			key: '" onmouseover/=alert(document.cookie)       //;&gt;/',
		};
		expect(sanitizeDeep(input)).to.eql(output);
	});

	it('on js functions should destructor for = in as html code with unicode slash', () => {
		const input = {
			key: '" onmouseoverU+002F&#61;alert(document.cookie)       //;&gt;/',
		};
		const output = {
			key: '" onmouseoverU+002F=alert(document.cookie)       //;&gt;/',
		};
		expect(sanitizeDeep(input)).to.eql(output);
	});

	it('muliple on js functions should destructor', () => {
		const input = {
			key: '" onloadonload=alert(document.cookie)       //;&gt;/',
		};
		const output = {
			key: '“ onloadonload=alert(document.cookie)       //;&gt;/',
		};
		expect(sanitizeDeep(input)).to.eql(output);
	});

	it('onload as text should NOT destructor', () => {
		const input = {
			key: '" onload = alert(document.cookie)       //;&gt;/',
		};
		const output = {
			key: '“ onload = alert(document.cookie)       //;&gt;/',
		};
		expect(sanitizeDeep(input)).to.eql(output);
	});

	it('onload with == is destructor too', () => {
		const input = {
			key: '" onload==alert(document.cookie)       //;&gt;/',
		};
		const output = {
			key: '“ onload==alert(document.cookie)       //;&gt;/',
		};
		expect(sanitizeDeep(input)).to.eql(output);
	});

	it('ononmouseover with " gets transformed to “', () => {
		const input = {
			key: '" ononmouseover=alert(1) Test',
		};
		const output = {
			key: '“ ononmouseover=alert(1) Test',
		};
		expect(sanitizeDeep(input)).to.eql(output);
	});

	it('controlslist should not sanitize ', () => {
		const input = {
			key: ' controlslist="do stuff"',
		};
		const output = {
			key: ' controlslist="do stuff"',
		};
		expect(sanitizeDeep(input)).to.eql(output);
	});
});
