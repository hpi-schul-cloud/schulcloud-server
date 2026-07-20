import { type CommonCartridgeOrganizationElementPropsV110 } from '../elements/v1.1.0';
import { type CommonCartridgeOrganizationElementPropsV130 } from '../elements/v1.3.0';

export type CommonCartridgeOrganizationNodeProps = Omit<
	CommonCartridgeOrganizationElementPropsV110 | CommonCartridgeOrganizationElementPropsV130,
	'items'
>;

export type CommonCartridgeOrganizationProps = Omit<CommonCartridgeOrganizationNodeProps, 'version' | 'type'>;
