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


import { InlineResponse20013Data } from './inline-response20013-data';

/**
 * 
 * @export
 * @interface InlineResponse20013
 */
export interface InlineResponse20013 {
    /**
     * 
     * @type {number}
     * @memberof InlineResponse20013
     */
    code?: number;
    /**
     * 
     * @type {string}
     * @memberof InlineResponse20013
     */
    message?: string;
    /**
     * 
     * @type {InlineResponse20013Data}
     * @memberof InlineResponse20013
     */
    data?: InlineResponse20013Data;
}

