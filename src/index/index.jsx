import Render from './../render.jsx';
import React, { Component } from 'react';
import axios from 'axios';
import './index.css';

class IndexPage extends Component {
  constructor(props) {
		 super(props);

		 this.state = {
			 CAstring: '',
			 caseErr: [],
			 caseSuccess: []
		 }
		 
		 this.CAs = new Map();

		 this.changeInput = this.changeInput.bind(this);
		 this.fillCAs = this.fillCAs.bind(this);
		 this.parseCAs = this.parseCAs.bind(this);
	}

	changeInput(e) {
		this.setState({CAstring: e.target.value});
	}

	parseCAs() {
		this.state.CAstring.split('\n').forEach((rawLine) => {
			if (rawLine !== 'undefined') {
				const line = rawLine.split('-');
				const year = line[0];
				const caseNumber = line[2];
				const CAname = year + caseNumber;
				this.CAs.set(CAname, {
					year,
					caseNumber,
					lastMainEvent: '',
					opinion: [{
						value: '',
						memo: ''
					}],
					attorney: [{
						name: '',
						address: '',
						party: {
							name: '',
							type: ''
						}
					}],
					circuit: [{
						county: '',
						caseNumber: '',
						judgmentDate: '',
						judgeName: ''
					}]
				});
			}
		});
	}

	fillCAs() {
		this.parseCAs();
		const CAs = this.CAs;
		CAs.forEach((baseCA) => {
			axios.get('http://apps.courts.ky.gov/coa_public/CaseInfo.aspx?case='+baseCA.year+'CA'+baseCA.caseNumber).then((res) => {
				try {
					const rawData = res.data.replace(/(?:\r\n|\n|\r)/g, ' ');
					
					let CA = {
						year: baseCA.year,
						caseNumber: baseCA.caseNumber,
						lastMainEvent: '',
						opinion: [],
						attorney: [],
						circuit: []
					}
					
					const lastMainEventOne = rawData.split('Last Main Event:</td>', 2);
					const lastMainEventTwo = lastMainEventOne[1].split('</td>', 1);
					const lastMainEvent = lastMainEventTwo[0].split('>', 2);
					CA.lastMainEvent = lastMainEvent[1];
					
					const stepSectionOne = rawData.split('Memo</th>', 2);
					const stepSectionTwo = stepSectionOne[1].split('</table>', 1);
					const rawStepSheet = stepSectionTwo[0];
					const rawSteps = rawStepSheet.split('<tr>');
					
					rawSteps.forEach((step) => {
						const rawSteps = step.split('<td');
						if (rawSteps.length > 4) {
							const rawStepsDesc = rawSteps[3].split('>');
							const rawStepsMemo = rawSteps[4].split('>');
							if (rawStepsDesc[1].startsWith('OPINION -')) {
								CA.opinion.push({
									value: rawStepsDesc[1].substr(10, rawStepsDesc[1].length - 14),
									memo: rawStepsMemo[1].substr(0, rawStepsMemo[1].length - 4)
								});
							}
						}
					});

					const rawAttorneyInfoOne = rawData.split('id="span_attorney_info"', 2);
					const rawAttorneyInfoTwo = rawAttorneyInfoOne[1].split('</span>', 1);
					const rawAttorneyInfo = rawAttorneyInfoTwo[0].split('<tr');

					rawAttorneyInfo.forEach((info) => {
						const rawInfo = info.split('<td');
						if (rawInfo.length > 4) {
							let almostExtractedInfo = rawInfo[1].split('>');
							const name = almostExtractedInfo[1].substr(0, almostExtractedInfo[1].length - 4);
							
							almostExtractedInfo = rawInfo[2].split('>');
							const address = almostExtractedInfo[1].substr(0, almostExtractedInfo[1].length - 4);
							
							almostExtractedInfo = rawInfo[3].split('>');
							const partyName = almostExtractedInfo[1].substr(0, almostExtractedInfo[1].length - 4);
							
							almostExtractedInfo = rawInfo[4].split('>');
							const partyType = almostExtractedInfo[1].substr(0, almostExtractedInfo[1].length - 4);
							
							CA.attorney.push({
								name,
								address,
								party: {
									name: partyName,
									type: partyType
								}
							});
						}
					});
					
					const rawCircuitInfoOne = rawData.split('id="span_circuitinfo"', 2);
					const rawCircuitInfoTwo = rawCircuitInfoOne[1].split('</span>', 1);
					const rawCircuitInfo = rawCircuitInfoTwo[0].split('<tr');
					
					rawCircuitInfo.forEach((info) => {
						const rawInfo = info.split('<td');
						if (rawInfo.length > 4) {
								let almostExtractedInfo = rawInfo[1].split('>');
								const county = almostExtractedInfo[1].substr(0, almostExtractedInfo[1].length - 4);

								almostExtractedInfo = rawInfo[2].split('>');
								const caseNumber = almostExtractedInfo[1].substr(0, almostExtractedInfo[1].length - 4);

								almostExtractedInfo = rawInfo[3].split('>');
								const judgmentDate = almostExtractedInfo[1].substr(0, almostExtractedInfo[1].length - 4);

								almostExtractedInfo = rawInfo[4].split('>');
								const judgeName = almostExtractedInfo[1].substr(0, almostExtractedInfo[1].length - 4);

								CA.circuit.push({
									county,
									caseNumber,
									judgmentDate,
									judgeName
								});
						}
					});
					this.CAs.set(baseCA.year + baseCA.caseNumber, CA);

					let caseSuccess = this.state.caseSuccess;
					caseSuccess.push({info: 'Retrived '+baseCA.year+'-CA-'+baseCA.caseNumber+'-MA'});
					this.setState({caseSuccess});
				} catch(err) {
					let caseErr = this.state.caseErr;
					caseErr.push({err: 'Unable to retrive '+baseCA.year+'-CA-'+baseCA.caseNumber+'-MA'});
					this.setState({caseErr});
				}
			}).catch((err) => {
				console.log('Please report this error:');
				console.log(err);
			});
		});
	}

	render() {
		document.title = "Kentucky CA Grabber";
		return (
			<div className="App">
				<section id="input">
					<h1>Enter case numbers and years here</h1>
					<textarea onChange={this.changeInput} placeholder="2015-CA-001671-MA&#10;2014-CA-000809-MA" autoFocus value={this.state.CAstring}></textarea>
					<button type="submit" onClick={this.fillCAs}>Grab Data</button>
				</section>
				<section id="log">
					<section id="error">
						<h1>Cases unable to retrive</h1>
						{this.state.caseErr.map((element, i) => {
							return (<div key={i}><h5>{element.err}</h5></div>)
						})}
					</section>
					<section id="success">
						<h1>Cases retrived</h1>
						{this.state.caseSuccess.map((element, i) => {
							return (<div key={i}><h5>{element.info}</h5></div>)
						})}
					</section>
				</section>
			</div>
		);
	}
}

Render(IndexPage);
