/* tslint:disable */
/* eslint-disable */
/**
 * Etherpad API
 * Etherpad is a real-time collaborative editor scalable to thousands of simultaneous real time users. It provides full data export capabilities, and runs on your server, under your control.
 *
 * The version of the OpenAPI document: 1.3.0
 * Contact: support@example.com
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


// May contain unused imports in some cases
// @ts-ignore
import type { GetLastEditedUsingGET200ResponseData } from './get-last-edited-using-get200-response-data';

/**
 * 
 * @export
 * @interface GetLastEditedUsingGET200Response
 */
export interface GetLastEditedUsingGET200Response {
    /**
     * 
     * @type {number}
     * @memberof GetLastEditedUsingGET200Response
     */
    'code'?: number;
    /**
     * 
     * @type {string}
     * @memberof GetLastEditedUsingGET200Response
     */
    'message'?: string;
    /**
     * 
     * @type {GetLastEditedUsingGET200ResponseData}
     * @memberof GetLastEditedUsingGET200Response
     */
    'data'?: GetLastEditedUsingGET200ResponseData;
}
