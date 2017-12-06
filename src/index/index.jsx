import Render from './../render.jsx';
import React, { Component } from 'react';
import axios from 'axios';
import './index.css';

class MiniRL extends Component {
  constructor(props) {
		 super(props);

		 this.state = {
			 CAstring: '',
			 CAs: new Map()
		 }

		 this.changeInput = this.changeInput.bind(this);
		 this.fillCAs = this.fillCAs.bind(this);
		 this.parseCAs = this.parseCAs.bind(this);
	}

	changeInput(e) {
		this.setState({CAstring: e.target.value});
	}

	parseCAs() {
		CAstring.split('\n').forEach((rawLine) => {
			const line = rawLine.split('-');
			const year = line[0];
			const caseNumber = line[2];
			const CAname = year + caseNumber;
			this.state.CAs.set(CAname, {
				year,
				caseNumber,
				lastMain: '',
				opinion: [{
					value: '',
					memo: ''
				}],
				attorney: {},
				circuit: {}
			});
		});
	}

	fillCAs() {
		this.parseCAs();
		const CAs = this.state.CAs;
		CAs.forEach((CA) => {

		});
	}

	render() {
		document.title = "Kentucky CA Grabber";
		return (
			<div className="App">
				<section id="input">
					<h1>Enter case numbers and years here</h1>
						<textarea  onSubmit={this.getCAs} onChange={this.changeInput} placeholder="2015-CA-001671-MA&#10;2014-CA-000809-MA" autofocus value={this.state.CAstring} autoFocus></textarea>
						<button type="submit">Search</button>
				</section>
				<section id="errors">
					<h1>Cases unable to retrive</h1>
				</section>
			</div>
		);
	}
}

Render(MiniRL);
