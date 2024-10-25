import { Configuration } from '@hpi-schul-cloud/commons';
import { JwtAuthGuardConfig } from '@infra/auth-guard';
import { Algorithm } from 'jsonwebtoken';
import { env } from 'process';

export interface TldrawConfig extends JwtAuthGuardConfig {
	TLDRAW_DB_URL: string;
	NEST_LOG_LEVEL: string;
	INCOMING_REQUEST_TIMEOUT: number;
	TLDRAW_DB_COMPRESS_THRESHOLD: number;
	CONNECTION_STRING: string;
	FEATURE_TLDRAW_ENABLED: boolean;
	TLDRAW_PING_TIMEOUT: number;
	TLDRAW_GC_ENABLED: boolean;
	REDIS_URI: string | null;
	TLDRAW_ASSETS_ENABLED: boolean;
	TLDRAW_ASSETS_SYNC_ENABLED: boolean;
	TLDRAW_ASSETS_MAX_SIZE_BYTES: number;
	ASSETS_ALLOWED_MIME_TYPES_LIST: string;
	API_HOST: string;
	TLDRAW_MAX_DOCUMENT_SIZE: number;
	TLDRAW_FINALIZE_DELAY: number;
	PERFORMANCE_MEASURE_ENABLED: boolean;
}

export const TLDRAW_DB_URL: string = Configuration.get('TLDRAW_DB_URL') as string;
export const TLDRAW_SOCKET_PORT = Configuration.get('TLDRAW__SOCKET_PORT') as number;

export const S3_CONNECTION_NAME = 'tldraw-s3';
// we need to check if the endpoint is production or not
const s3Endpoint = env.S3_ENDPOINT || '';
const endpoint = env.NODE_ENV === 'production' ? `https://${s3Endpoint}` : s3Endpoint;
// There are temporary configurations for S3 it should read directly from env
export const tldrawS3Config = {
	connectionName: S3_CONNECTION_NAME,
	endpoint,
	region: env.S3_REGION as string,
	bucket: env.S3_BUCKET as string,
	accessKeyId: env.S3_ACCESS_KEY as string,
	secretAccessKey: env.S3_SECRET_KEY as string,
};

const jwtAuthGuardConfig: JwtAuthGuardConfig = {
	// Node's process.env escapes newlines. We need to reverse it for the keys to work.
	// See: https://stackoverflow.com/questions/30400341/environment-variables-containing-newlines-in-node
	JWT_PUBLIC_KEY: (Configuration.get('JWT_PUBLIC_KEY') as string).replace(/\\n/g, '\n'),
	JWT_SIGNING_ALGORITHM: Configuration.get('JWT_SIGNING_ALGORITHM') as Algorithm,
	SC_DOMAIN: Configuration.get('SC_DOMAIN') as string,
};

const tldrawConfig: TldrawConfig = {
	TLDRAW_DB_URL,
	NEST_LOG_LEVEL: Configuration.get('TLDRAW__LOG_LEVEL') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
	TLDRAW_DB_COMPRESS_THRESHOLD: Configuration.get('TLDRAW__DB_COMPRESS_THRESHOLD') as number,
	FEATURE_TLDRAW_ENABLED: Configuration.get('FEATURE_TLDRAW_ENABLED') as boolean,
	CONNECTION_STRING: Configuration.get('TLDRAW_DB_URL') as string,
	TLDRAW_PING_TIMEOUT: Configuration.get('TLDRAW__PING_TIMEOUT') as number,
	TLDRAW_GC_ENABLED: Configuration.get('TLDRAW__GC_ENABLED') as boolean,
	REDIS_URI: Configuration.has('REDIS_URI') ? (Configuration.get('REDIS_URI') as string) : null,
	TLDRAW_ASSETS_ENABLED: Configuration.get('TLDRAW__ASSETS_ENABLED') as boolean,
	TLDRAW_ASSETS_SYNC_ENABLED: Configuration.get('TLDRAW__ASSETS_SYNC_ENABLED') as boolean,
	TLDRAW_ASSETS_MAX_SIZE_BYTES: Configuration.get('TLDRAW__ASSETS_MAX_SIZE_BYTES') as number,
	ASSETS_ALLOWED_MIME_TYPES_LIST: Configuration.get('TLDRAW__ASSETS_ALLOWED_MIME_TYPES_LIST') as string,
	API_HOST: Configuration.get('API_HOST') as string,
	TLDRAW_MAX_DOCUMENT_SIZE: Configuration.get('TLDRAW__MAX_DOCUMENT_SIZE') as number,
	TLDRAW_FINALIZE_DELAY: Configuration.get('TLDRAW__FINALIZE_DELAY') as number,
	PERFORMANCE_MEASURE_ENABLED: Configuration.get('TLDRAW__PERFORMANCE_MEASURE_ENABLED') as boolean,
	...jwtAuthGuardConfig,
};

export const config = () => tldrawConfig;
