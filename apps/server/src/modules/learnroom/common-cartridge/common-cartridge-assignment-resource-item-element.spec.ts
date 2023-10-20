import {
	CommonCartridgeAssignmentResourceItemElement,
	ICommonCartridgeAssignmentResourceItemProps,
} from './common-cartridge-assignment-resource-item-element';

describe('CommonCartridgeAssignmentResourceItemElement', () => {
	let props: ICommonCartridgeAssignmentResourceItemProps;
	let element: CommonCartridgeAssignmentResourceItemElement;

	beforeEach(() => {
		props = {
			identifier: 'assignment-identifier',
			type: 'assignment',
			href: 'https://example.tld',
		};
		element = new CommonCartridgeAssignmentResourceItemElement(props);
	});

	it('should transform props into the expected element structure', () => {
		const expectedOutput = {
			$: {
				identifier: props.identifier,
				type: props.type,
			},
			file: {
				$: {
					href: props.href,
				},
			},
		};

		const transformed = element.transform();

		expect(transformed).toEqual(expectedOutput);
	});
});
