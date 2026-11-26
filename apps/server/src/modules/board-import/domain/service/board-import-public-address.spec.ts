import { isPublicAddress } from './board-import-public-address';

describe('isPublicAddress', () => {
	describe('when the address is public', () => {
		it.each([
			{ address: '93.184.216.34', family: 4 as const },
			{ address: '8.8.8.8', family: 4 as const },
			{ address: '2606:4700:4700::1111', family: 6 as const },
		])('should return true for "$address"', ({ address, family }) => {
			const result = isPublicAddress(address, family);

			expect(result).toBe(true);
		});
	});

	describe('when the address is not public', () => {
		it.each([
			{ address: '0.0.0.0', family: 4 as const },
			{ address: '10.0.0.5', family: 4 as const },
			{ address: '100.64.0.1', family: 4 as const },
			{ address: '127.0.0.1', family: 4 as const },
			{ address: '169.254.169.254', family: 4 as const },
			{ address: '172.16.0.1', family: 4 as const },
			{ address: '172.31.255.255', family: 4 as const },
			{ address: '192.168.1.1', family: 4 as const },
			{ address: '192.0.2.1', family: 4 as const },
			{ address: '198.18.0.1', family: 4 as const },
			{ address: '224.0.0.1', family: 4 as const },
			{ address: '255.255.255.255', family: 4 as const },
			{ address: '::', family: 6 as const },
			{ address: '::1', family: 6 as const },
			{ address: '::ffff:10.0.0.1', family: 6 as const },
			{ address: '::ffff:8.8.8.8', family: 6 as const },
			{ address: '64:ff9b::a00:1', family: 6 as const },
			{ address: 'fc00::1', family: 6 as const },
			{ address: 'fd12::1', family: 6 as const },
			{ address: 'fe80::1', family: 6 as const },
			{ address: 'ff02::1', family: 6 as const },
			{ address: '2001:db8::1', family: 6 as const },
			{ address: '2002:a00:1::1', family: 6 as const },
			{ address: '2001::1', family: 6 as const },
		])('should return false for "$address"', ({ address, family }) => {
			const result = isPublicAddress(address, family);

			expect(result).toBe(false);
		});
	});

	describe('when the address is not a valid address of the family', () => {
		it.each([
			{ address: 'not-an-address', family: 4 as const },
			{ address: '8.8.8.8', family: 6 as const },
		])('should return false for "$address" with family $family', ({ address, family }) => {
			const result = isPublicAddress(address, family);

			expect(result).toBe(false);
		});
	});
});
