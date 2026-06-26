import { BoardNode } from './board-node.do';
import type { MapElementProps } from './types';

export class MapElement extends BoardNode<MapElementProps> {
	get centerLat(): number {
		return this.props.centerLat;
	}

	set centerLat(value: number) {
		this.props.centerLat = value;
	}

	get centerLng(): number {
		return this.props.centerLng;
	}

	set centerLng(value: number) {
		this.props.centerLng = value;
	}

	get zoom(): number {
		return this.props.zoom;
	}

	set zoom(value: number) {
		this.props.zoom = value;
	}

	get features(): string {
		return this.props.features;
	}

	set features(value: string) {
		this.props.features = value;
	}

	canHaveChild(): boolean {
		return false;
	}
}

export const isMapElement = (reference: unknown): reference is MapElement => reference instanceof MapElement;
