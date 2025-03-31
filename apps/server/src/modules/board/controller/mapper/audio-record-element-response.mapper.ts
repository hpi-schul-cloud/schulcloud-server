import { ContentElementType } from '../../domain';
import { AudioRecordElement } from '../../domain/audio-record-element.do';
import { AudioRecordElementContent, AudioRecordElementResponse, TimestampsResponse } from '../dto';
import { BaseResponseMapper } from './base-mapper.interface';

export class AudioRecordElementResponseMapper implements BaseResponseMapper {
	private static instance: AudioRecordElementResponseMapper;

	public static getInstance(): AudioRecordElementResponseMapper {
		if (!AudioRecordElementResponseMapper.instance) {
			AudioRecordElementResponseMapper.instance = new AudioRecordElementResponseMapper();
		}

		return AudioRecordElementResponseMapper.instance;
	}

	public mapToResponse(element: AudioRecordElement): AudioRecordElementResponse {
		const result = new AudioRecordElementResponse({
			id: element.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
			type: ContentElementType.AUDIO_RECORD,
			content: new AudioRecordElementContent({ caption: element.caption, alternativeText: element.alternativeText }),
		});

		return result;
	}

	public canMap(element: unknown): boolean {
		return element instanceof AudioRecordElement;
	}
}
