import { createPinnedLookup } from './board-import-pinned-lookup';

describe('createPinnedLookup', () => {
	const setup = () => {
		const checkedAddress = { address: '93.184.216.34', family: 4 as const };
		const lookup = createPinnedLookup(checkedAddress);
		const callback = jest.fn();

		return { checkedAddress, lookup, callback };
	};

	describe('when the caller asks for all addresses', () => {
		it('should give a list with only the checked address', () => {
			const { checkedAddress, lookup, callback } = setup();

			lookup('other-host.example', { all: true }, callback);

			expect(callback).toHaveBeenCalledWith(null, [checkedAddress]);
		});
	});

	describe('when the caller asks for one address', () => {
		it('should give the checked address and its family', () => {
			const { checkedAddress, lookup, callback } = setup();

			lookup('other-host.example', {}, callback);

			expect(callback).toHaveBeenCalledWith(null, checkedAddress.address, checkedAddress.family);
		});
	});
});
