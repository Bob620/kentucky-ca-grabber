import Render from './../render.jsx';
import React, { Component } from 'react';
import './404.css';

class Waifu extends Component {
  constructor() {
	   super();
  }

	render() {
		document.title = "MiniRL - 404";
		return (
			<div className="App">
			  <h1>404</h1>
				<p>Couldn't find that link</p>
			</div>
		);
	}
}

Render(Waifu);
