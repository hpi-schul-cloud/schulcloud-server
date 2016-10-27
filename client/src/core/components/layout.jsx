import React from 'react';
import {Link} from 'react-router'

import Header from './header';
import Footer from './footer';

require('../styles/base.less');
require('../styles/layout.less');

class Layout extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		/* props come from router */
		return (
			<div id="layout">
				<Header />
				{this.props.children}
				<Footer />
			</div>
		);
	}
}

export default Layout;
