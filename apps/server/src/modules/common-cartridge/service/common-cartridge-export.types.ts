import { type FileRecordResponse } from '@infra/common-cartridge-clients';
import { type Stream } from 'node:stream';

export type FileMetadataAndStream = { name: string; file: Stream; fileDto: FileRecordResponse };
