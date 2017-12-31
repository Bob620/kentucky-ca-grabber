import Render from './../render.jsx';
import React, { Component } from 'react';
import axios from 'axios';
import './index.css';
const fs = window.require('fs'); 
const remote = window.require('electron').remote;
const dialog = remote.dialog;

class IndexPage extends Component {
  constructor(props) {
		 super(props);

		 this.state = {
			 CAstring: '',
			 caseErr: [],
			 caseSuccess: [],
			 processing: false
		 }
		 
		 this.CAs = new Map();

		 this.changeInput = this.changeInput.bind(this);
		 this.fillCAs = this.fillCAs.bind(this);
		 this.parseCAs = this.parseCAs.bind(this);
		 this.createFile = this.createFile.bind(this);
	}

	createFile() {
		let content = 'Year,Case Number,Last Main Event,Opinon ~:~ Memo,Attornery Name ~~ Party ~:~ Party Type,Circuit ~:~ Judge Last Name; First Name ~~ Judgment Date\n';
		this.CAs.forEach(({found, year, lastMainEvent, caseNumber, opinion, attorney, circuit}) => {
			if (found) {
				content = content + `${year},${caseNumber},${lastMainEvent},`;
				for (let i = 0; i < opinion.length-1; i++) {
					const opi = opinion[i];
					content = content+`${opi.value} ~:~ ${opi.memo} ~|~ `;
				}
				const opi = opinion[opinion.length-1];
				content = content+`${opi.value} ~:~ ${opi.memo},`;

				for (let i = 0; i < attorney.length-1; i++) {
					const attor = attorney[i];
					content = content+`${attor.name} ~~ ${attor.party.name} ~:~ ${attor.party.type} ~|~ `;
				}
				const attor = attorney[attorney.length-1];
				content = content+`${attor.name} ~~ ${attor.party.name} ~:~ ${attor.party.type},`;
				
				for (let i = 0; i < circuit.length-1; i++) {
					const circ = circuit[i];
					content = content+`${circ.county} ~:~ ${circ.judgeName} ~~ ${circ.judgmentDate} ~|~ `;
				}
				const circ = circuit[circuit.length-1];
				content = content+`${circ.county} ~:~ ${circ.judgeName} ~~ ${circ.judgmentDate}\n`;
			}
		});
		dialog.showSaveDialog({defaultPath: 'CaseInfo.csv'}, (fileName) => {
			if (fileName === undefined){
					console.log("You didn't save the file");
					return;
			}
		
			// fileName is a string that contains the path and filename created in the save file dialog.  
			fs.writeFile(fileName, content, (err) => {
					if(err){
							alert("An error ocurred creating the file "+ err.message)
					}
					alert("The file has been succesfully saved");
			});
		});
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
					found: false,
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
		this.setState({
			processing: true,
			caseErr: [],
			caseSuccess: []
		});
		this.parseCAs();
		const CAs = this.CAs;
		CAs.forEach((baseCA) => {
			axios.get('http://apps.courts.ky.gov/coa_public/CaseInfo.aspx?case='+baseCA.year+'CA'+baseCA.caseNumber).then((res) => {
				try {
					const rawData = res.data.replace(/(?:\r\n|\n|\r)/g, ' ').replace(/,/g, ';');
					
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
							} else if (rawStepsDesc[1].startsWith('OPINION AND ')) {
								CA.opinion.push({
									value: rawStepsDesc[1].substr(20, rawStepsDesc[1].length - 24),
									memo: rawStepsMemo[1].substr(0, rawStepsMemo[1].length - 4)
								});
							} else if (rawStepsDesc[1].startsWith('OPIN.- ')) {
								CA.opinion.push({
									value: rawStepsDesc[1].substr(7, rawStepsDesc[1].length - 11),
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
					CA.found = true;

					this.CAs.set(baseCA.year + baseCA.caseNumber, CA);

					let caseSuccess = this.state.caseSuccess;
					caseSuccess.push({id: baseCA.year+baseCA.caseNumber, info: 'Retrived '+baseCA.year+'-CA-'+baseCA.caseNumber});
					this.setState({caseSuccess});
				} catch(err) {
					let caseErr = this.state.caseErr;
					caseErr.push({id: baseCA.year+baseCA.caseNumber, info: 'Unable to retrive '+baseCA.year+'-CA-'+baseCA.caseNumber});
					this.setState({caseErr});
				}
				console.log(this.CAs.size+" | "+this.state.caseErr.length + this.state.caseSuccess.length);
				if (this.CAs.size == this.state.caseErr.length + this.state.caseSuccess.length) {
					this.setState({processing: false});
				}
			}).catch((err) => {
				console.log('Please report this error:');
				console.log(err);
			});
		});
	}

	render() {
		document.title = "Kentucky CA Grabber";
		console.log(this.state.processing);
		return (
			<div className="App">
				<section id="input">
					<h1>Enter case numbers and years here</h1>
					<textarea onChange={this.changeInput} placeholder="2015-CA-001671-MA&#10;2014-CA-000809-MA" autoFocus value={this.state.CAstring}></textarea>
					<button type="submit" onClick={this.fillCAs}>Grab CAs</button>
					<button type="submit" disabled={this.state.processing} onClick={this.createFile}>{this.state.processing ? "Getting CAs..." : "Export to File"}</button>
				</section>
				<section id="log">
					<section id="error">
						<h1>Cases unable to retrive</h1>
						{this.state.caseErr.map((element, i) => {
							return (<div key={element.id}><h5>{element.info}</h5></div>)
						})}
					</section>
					<section id="success">
						<h1>Cases retrived</h1>
						{this.state.caseSuccess.map((element, i) => {
							return (<div key={element.id}><h5>{element.info}</h5></div>)
						})}
					</section>
				</section>
			</div>
		);
	}
}

Render(IndexPage);
