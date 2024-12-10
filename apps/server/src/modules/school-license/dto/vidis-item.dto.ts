// TODO Think of a better name for this class
export interface VidisItemProps {
	offerId: string;
	schoolActivations: string[];
}

export class VidisItemDto {
	offerId: string;

	schoolActivations: string[];

	constructor(props: VidisItemProps) {
		this.offerId = props.offerId;
		this.schoolActivations = props.schoolActivations;
	}
}
