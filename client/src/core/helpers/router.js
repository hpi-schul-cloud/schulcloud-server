import React from 'react';
import { render } from 'react-dom';
import { browserHistory, hashHistory, Router, Route, Link } from 'react-router'

import { Helpers, Containers } from '../../core';

let router = null;
let routes = {};

export default {

	AddRoute: (key, {path, name, component}) => {
		routes[key] = {
			path,
			name,
			component
		};
	},

	GetRouter: () => {
		if (router) return router;

		router = (<Router history={browserHistory} routes={{
			path: '/',
			component: Containers.Layout,
			childRoutes: Object.values(routes)
		}} />);

		return router;
	},

	GetRoutes: () => {
		return routes;
	}

};
