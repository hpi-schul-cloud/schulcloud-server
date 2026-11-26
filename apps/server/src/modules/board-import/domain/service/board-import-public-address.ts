import { BlockList, isIP } from 'node:net';

type AddressRange = [prefix: string, prefixLength: number];

const BLOCKED_IPV4_RANGES: AddressRange[] = [
	['0.0.0.0', 8],
	['10.0.0.0', 8],
	['100.64.0.0', 10],
	['127.0.0.0', 8],
	['169.254.0.0', 16],
	['172.16.0.0', 12],
	['192.0.0.0', 24],
	['192.0.2.0', 24],
	['192.88.99.0', 24],
	['192.168.0.0', 16],
	['198.18.0.0', 15],
	['198.51.100.0', 24],
	['203.0.113.0', 24],
	['224.0.0.0', 4],
	['240.0.0.0', 4],
];
// Only global unicast is public. The blocked ranges inside it are for protocols and documentation,
// or they contain an IPv4 address.
const GLOBAL_UNICAST_IPV6_RANGE: AddressRange = ['2000::', 3];
const BLOCKED_IPV6_RANGES: AddressRange[] = [
	['2001::', 23],
	['2001:db8::', 32],
	['2002::', 16],
	['3fff::', 20],
];

const createBlockList = (ranges: AddressRange[], type: 'ipv4' | 'ipv6'): BlockList => {
	const blockList = new BlockList();
	ranges.forEach(([prefix, prefixLength]) => blockList.addSubnet(prefix, prefixLength, type));

	return blockList;
};

const blockedIpv4 = createBlockList(BLOCKED_IPV4_RANGES, 'ipv4');
const globalUnicastIpv6 = createBlockList([GLOBAL_UNICAST_IPV6_RANGE], 'ipv6');
const blockedIpv6 = createBlockList(BLOCKED_IPV6_RANGES, 'ipv6');

export const isPublicAddress = (address: string, family: 4 | 6): boolean => {
	if (isIP(address) !== family) {
		return false;
	}

	if (family === 4) {
		const isPublicIpv4 = !blockedIpv4.check(address, 'ipv4');

		return isPublicIpv4;
	}

	const isPublicIpv6 = globalUnicastIpv6.check(address, 'ipv6') && !blockedIpv6.check(address, 'ipv6');

	return isPublicIpv6;
};
