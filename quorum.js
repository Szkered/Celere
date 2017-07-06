const argv = require('minimist')(process.argv.slice(2));
const Web3 = require('web3');
const fs = require('fs');
const celere = require('./celere');
const providerURL = "http://127.0.0.1";
const providerPort = "2200".concat(argv.node);

// connect to block chain
if (typeof web3 !== 'undefined') {
	web3 = new Web3(web3.currentProvider);
} else {
	// set the provider you want from Web3.providers
	web3 = new Web3(new Web3.providers.HttpProvider(providerURL + ":" + providerPort));
}

var pubKeys = [
    'BULeR8JyUWhiuuCMU/HLA0Q5pzkYT+cHII3ZKBey3Bo=',
    'QfeDAys9MPDs2XHExtc84jKGHxZg/aj52DTh0vtA3Xc=',
    '1iTZde/ndBHvzhcl7V68x44Vx7pl8nwx9LqnM/AfJUg=',
    'oNspPPgszVUFw0qmGFfWwh1uxVUXgvBxleXORHj07g8=',
    'R56gy4dn24YOjwyesTczYa8m5xhP6hF2uTMCju/1xkY=',
    'UfNSeSGySeKg11DVNEnqrUtxYRVor4+CvluI8tVv62Y=',
    'ROAZBWtSacxXQrOe3FGAqJDyJjFePR5ce4TSIzmJ0Bc='
]

var exec = argv.exec
if (exec === 'deploy') {
    celere.deployContract(web3, fs, './contract/rtgs.sol', 'Stash', ['JPM', 0],
    			[pubKeys[1], pubKeys[2], pubKeys[4]])
    	.then(() => {
    	    return celere.deployContract(web3, fs, './contract/rtgs.sol', 'Stash', ['DBS', 0],
    				       [pubKeys[1], pubKeys[2], pubKeys[4]]);
    	}).then(() => {
    	    return celere.deployContract(web3, fs, './contract/rtgs.sol', 'Stash', ['UOB', 0],
    				       [pubKeys[1], pubKeys[2], pubKeys[4]]);
    	}).then(() => {
    	    return celere.deployContract(web3, fs, './contract/rtgs.sol', 'PaymentAgent', [],
    				       pubKeys.slice(1));
    	});
} else if (exec === 'register') {
    var pa = celere.getContract(web3, fs, 'PaymentAgent');

    console.log(pa.registerStash('JPM', '0x1932c48b2bf8102ba33b4a6b545c32236e342f34',
    				 {from:web3.eth.accounts[0],privateFor:pubKeys.slice(1)}));
    console.log(pa.registerStash('DBS', '0x1349f3e1b8d71effb47b840594ff27da7e603d17',
    				 {from:web3.eth.accounts[0],privateFor:pubKeys.slice(1)}));
    console.log(pa.registerStash('UOB', '0x9d13c6d3afe1721beef56b55d303b09e021e27ab',
    				 {from:web3.eth.accounts[0],privateFor:pubKeys.slice(1)}));
    
} else if (exec === 'pledge') {
    var ta = celere.getContract(web3, fs, 'PaymentAgent');

    ta.pledge('JPM', 10000, {from:web3.eth.accounts[0],
    			   privateFor:[pubKeys[1]]});
    ta.pledge('DBS', 10000, {from:web3.eth.accounts[0],
    			   privateFor:[pubKeys[2]]});
    ta.pledge('UOB', 10000, {from:web3.eth.accounts[0],
    			     privateFor:[pubKeys[4]]});
    
} else if (exec === 'bal') {
    var ta = celere.getContract(web3, fs, 'PaymentAgent');

    // can use parseInt() to convert the raw return value to int
    console.log('JPM');
    console.log(ta.stashRegistry('JPM'));
    console.log(ta.getStash('JPM',{from:web3.eth.accounts[0],privateFor:[]}));
    console.log('DBS');
    console.log(ta.stashRegistry('DBS'));
    console.log(ta.getStash('DBS',{from:web3.eth.accounts[0],privateFor:[]}));
    console.log('UOB');
    console.log(ta.stashRegistry('UOB'));
    console.log(ta.getStash('UOB',{from:web3.eth.accounts[0],privateFor:[]}));
    
} else if (exec === 'transfer') {
    var ta = celere.getContract(web3, fs, 'PaymentAgent');
    ta.transfer('JPM', 'DBS', 300, {from:web3.eth.accounts[0],
    				    privateFor:[pubKeys[0],pubKeys[2]]});
}
