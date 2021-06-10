const assert = require('assert');
const { Given, When, Then } = require('@cucumber/cucumber');
const fs = require('fs');
const moment = require('moment');
const cmd = require('../cmd');

const patterns = `[{"key":["DOMINOS PIZZA"],"Contents":"Dominos Pizza","Main Cat.":"食費","Sub Cat.":"配達","Inc./Exp.":"支出"},{"key":["AMZN","Amazon.com"],"Contents":"Amazon","Main Cat.":"買い物","Inc./Exp.":"支出"},{"key":["NETFLIX"],"Contents":"Netflix","Main Cat.":"娯楽","Inc./Exp.":"支出"},{"key":["SPOTIFY"],"Contents":"Spotify","Main Cat.":"娯楽","Inc./Exp.":"支出"},{"key":["CHEGG"],"Contents":"Chegg","Main Cat.":"習い事","Inc./Exp.":"支出"},{"key":["OSMOW'S"],"Contents":"Osmow’s","Main Cat.":"食費","Sub Cat.":"外食","Inc./Exp.":"支出"},{"key":["APPLE.COM"],"Contents":"Apple","Main Cat.":"買い物","Inc./Exp.":"支出"},{"key":["WAL-MART"],"Contents":"Walmart","Main Cat.":"食費","Inc./Exp.":"支出"},{"key":["UBER   * EATS"],"Contents":"Uber Eats","Main Cat.":"食費","Sub Cat.":"配達","Inc./Exp.":"支出"}]`;

const allTransactions = `\
Date	Account	Main Cat.	Sub Cat.	Contents	Amount	Inc./Exp.	Details
3/11/2021	デビットカード	食費	外食	Osmow’s	11.57	支出	
3/16/2021	デビットカード	買い物		Amazon	16.99	支出	
3/17/2021	デビットカード	食費	配達	Dominos Pizza	10.31	支出	
3/18/2021	デビットカード	食費		Walmart	11.85	支出	
3/21/2021	デビットカード	食費	外食	Osmow’s	12.42	支出	
3/24/2021	デビットカード	娯楽		Netflix	18.99	支出	
3/24/2021	デビットカード	買い物		Apple	3.15	支出	
3/27/2021	デビットカード	買い物		Amazon	29.25	支出	
4/1/2021	デビットカード	食費	配達	Dominos Pizza	24.98	支出	
4/1/2021	デビットカード	娯楽		Spotify	9.99	支出	
4/4/2021	デビットカード	習い事		Chegg	19.62	支出	
4/9/2021	デビットカード	買い物		Apple	6.2	支出	
`;

Given("I'm using a debit account", function () {
	this.account = '2';
});

Given('I want to include all transactions', function () {
	this.dateLimit = '01/01/1970';
});

Given('I provide a valid csv file path', function () {
	this.inputPath = 'src/__test__/transactions.csv';
});

Given('all patterns are recorded in `patterns.json`', function () {
	fs.writeFileSync('patterns.json', patterns);
});

When('I run the application with given parameters', function () {
	const run = cmd
		.create('./dist/')
		.execute(
			[],
			[
				this.inputPath,
				cmd.ENTER,
				this.account,
				cmd.ENTER,
				this.dateLimit,
				cmd.ENTER,
			],
			{ timeout: 80 }
		);

	return run;
});

Then('I will get a tsv file in the same directory', function () {
	assert.strictEqual(fs.existsSync('out.tsv'), true);
});

Then('it will have all transactions', function () {
	readOutput(this);

	assert.strictEqual(this.outFile, allTransactions);
});

Given('I want to exclude transactions before {string}', function (dateLimit) {
	this.dateLimit = dateLimit;
});

Then('the file will only have transactions after {string}', function (date) {
	readOutput(this);
	let transactionsAfterDate = allTransactions
		.split('\n')
		.filter((line, i, arr) => {
			return (
				i === 0 ||
				i === arr.length - 1 ||
				moment(line.split('\t')[0], [
					'M/D/YYYY',
					'MM/D/YYYY',
					'M/DD/YYYY',
					'MM/DD/YYYY',
				]).isSameOrAfter(moment(date, 'DD/MM/YYYY'))
			);
		});

	assert.deepStrictEqual(this.outFile, transactionsAfterDate.join('\n'));
});

function readOutput(scenarioThis) {
	if (!scenarioThis.outFile)
		scenarioThis.outFile = fs.readFileSync('out.tsv').toString();
}
