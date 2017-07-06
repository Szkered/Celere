const argv = require('minimist')(process.argv.slice(2));
const Web3 = require('web3');
const fs = require('fs');
const celere = require('./celere');
const providerURL = "http://127.0.0.1";
const n_nodes = 7;
// const providerPort = "2200".concat(argv.node);

// connect to all 7 nodes
if (typeof web3 !== 'undefined') {
    var web3 = [];
    for (var i = 0; i < n_nodes; i++) {
	web3[i] = new Web3(web3[i].currentProvider);
    }
} else {
    // set the provider you want from Web3.providers
    var web3 = [];
    for (var i = 0; i < n_nodes; i++) {
	web3[i] = new Web3(new Web3.providers.HttpProvider(providerURL + ":" + "2200".concat(i)));
    }
}
// if (typeof web3 !== 'undefined') {
// 	web3 = new Web3(web3.currentProvider);
// } else {
// 	// set the provider you want from Web3.providers
// 	web3 = new Web3(new Web3.providers.HttpProvider(providerURL + ":" + providerPort));
// }

var pubKeys = [
    'BULeR8JyUWhiuuCMU/HLA0Q5pzkYT+cHII3ZKBey3Bo=',
    'QfeDAys9MPDs2XHExtc84jKGHxZg/aj52DTh0vtA3Xc=',
    '1iTZde/ndBHvzhcl7V68x44Vx7pl8nwx9LqnM/AfJUg=',
    'oNspPPgszVUFw0qmGFfWwh1uxVUXgvBxleXORHj07g8=',
    'R56gy4dn24YOjwyesTczYa8m5xhP6hF2uTMCju/1xkY=',
    'UfNSeSGySeKg11DVNEnqrUtxYRVor4+CvluI8tVv62Y=',
    'ROAZBWtSacxXQrOe3FGAqJDyJjFePR5ce4TSIzmJ0Bc='
]


// 3 Bank RTGS test for transfer and netting  
// node 0: MAS                                
// node 1: JPM                                
// node 2: DBS                                
// node 3: UOB                                
var exec = argv.exec
if (exec === 'deploy') {
    celere.deployContract(web3[0], fs, './contract/rtgs.sol', 'PaymentAgent', [],
			  pubKeys.slice(1))
	.then(() => {
    	    return celere.deployContract(web3[0], fs, './contract/rtgs.sol', 'Stash', ['JPM', 0],
    					 pubKeys.slice(1));
    	}).then(() => {
    	    return celere.deployContract(web3[0], fs, './contract/rtgs.sol', 'Stash', ['DBS', 0],
    					 pubKeys.slice(1));
    	}).then(() => {
    	    return celere.deployContract(web3[0], fs, './contract/rtgs.sol', 'Stash', ['UOB', 0],
    					 pubKeys.slice(1));
    	});
} else if (exec === 'create_stash') {
    var pa = celere.getContract(web3[0], fs, 'PaymentAgent');
    console.log(pa.createStash('JPM', {from:web3[0].eth.accounts[0],
				       privateFor:pubKeys.slice(1)}));
    console.log(pa.createStash('DBS', {from:web3[0].eth.accounts[0],
				       privateFor:pubKeys.slice(1)}));
    console.log(pa.createStash('UOB', {from:web3[0].eth.accounts[0],
				       privateFor:pubKeys.slice(1)}));
} else if (exec === 'register_stash') {
    var pa = celere.getContract(web3[0], fs, 'PaymentAgent');

    pa.registerStash('JPM', '0x1932c48b2bf8102ba33b4a6b545c32236e342f34',
    		     {from:web3[0].eth.accounts[0],privateFor:pubKeys.slice(1)});
    pa.registerStash('DBS', '0x1349f3e1b8d71effb47b840594ff27da7e603d17',
    		     {from:web3[0].eth.accounts[0],privateFor:pubKeys.slice(1)});
    pa.registerStash('UOB', '0x9d13c6d3afe1721beef56b55d303b09e021e27ab',
    		     {from:web3[0].eth.accounts[0],privateFor:pubKeys.slice(1)});
} else if (exec === 'mark_stash') {
    var pa = celere.getContract(web3[0], fs, 'PaymentAgent');
    console.log(pa.markStash('JPM', {from:web3[0].eth.accounts[0], privateFor:pubKeys[1]}));
    console.log(pa.markStash('DBS', {from:web3[0].eth.accounts[0], privateFor:pubKeys[2]}));
    console.log(pa.markStash('UOB', {from:web3[0].eth.accounts[0], privateFor:pubKeys[3]}));
    console.log(pa.markStash('', {from:web3[0].eth.accounts[0], privateFor:[]}));
} else if (exec === 'pledge') {
    var pa = celere.getContract(web3[0], fs, 'PaymentAgent');
    console.log(pa.pledge('JPM', 10000, {from:web3[0].eth.accounts[0], privateFor:[pubKeys[1]]}));
    console.log(pa.pledge('DBS', 10000, {from:web3[0].eth.accounts[0], privateFor:[pubKeys[2]]}));
    console.log(pa.pledge('UOB', 10000, {from:web3[0].eth.accounts[0], privateFor:[pubKeys[3]]}));
    
} else if (exec === 'bal') {
    // can use parseInt() to convert the raw return value to int
    function getBalance(web3) {
	var pa = celere.getContract(web3, fs, 'PaymentAgent');
	console.log(pa.stashNames(0));
	console.log('JPM');
	console.log(pa.stashRegistry('JPM'));
	console.log(pa.getStash('JPM',{from:web3.eth.accounts[0],privateFor:[]}));
	console.log('DBS');
	console.log(pa.stashRegistry('DBS'));
	console.log(pa.getStash('DBS',{from:web3.eth.accounts[0],privateFor:[]}));
	console.log('UOB');
	console.log(pa.stashRegistry('UOB'));
	console.log(pa.getStash('UOB',{from:web3.eth.accounts[0],privateFor:[]}));
	console.log('');
    }

    console.log('MAS view');
    getBalance(web3[0]);
    console.log('JPM view');
    getBalance(web3[1]);
    console.log('DBS view');
    getBalance(web3[2]);
    console.log('UOB view');
    getBalance(web3[3]);

    
} else if (exec === 'transfer') {
    var ta = celere.getContract(web3, fs, 'PaymentAgent');
    ta.transfer('JPM', 'DBS', 300, {from:web3.eth.accounts[0],
    				    privateFor:[pubKeys[0],pubKeys[2]]});
}
