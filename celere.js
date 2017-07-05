module.exports = {
    deployContract : function (web3, fs, contractSourcePath, contractName, initParams, priList) {
	var contractSource = fs.readFileSync(contractSourcePath, 'utf8');
	    // .replace(/(\r\n|\n|\r)/gm,"") // optionally inline the contract code;
	var contractCompiled = web3.eth.compile.solidity(contractSource);
	var contractName_c = Object.keys(contractCompiled).filter( (c_name) => {
	    return c_name.match(contractName) != null; } )[0]
	var contract = web3.eth.contract(contractCompiled[contractName_c].info.abiDefinition);

	return new Promise((resolve, reject) => {
	    contract.new.apply(contract, initParams.concat([
		{from: web3.eth.accounts[0],
		 data: contractCompiled[contractName_c].code,
		 gasPrice: 0,
		 gas: 300000000,
		 privateFor: priList},
		(e, contract) => {
		    if (e) {
			console.log("[Error] cannot creating contract\n", e);
			return reject(e);
		    } else {
			if (!contract.address) {
			    console.log("["+contractName+"] Deploying with params "+initParams);
			    console.log("["+contractName+"] Transaction send with hash: "
					+contract.transactionHash
					+" waiting to be mined...");
			} else {
			    console.log("["+contractName+"] mined! Address: " + contract.address);
			    fs.writeFile('./deployed/'+contractName+'.addr',
					 contract.address,
					 err => {
					     if(err) return console.log(err);
					     // console.log("Contract address saved!");
					 });
			    fs.writeFile('./deployed/'+contractName+'.json',
					 JSON.stringify(contractCompiled),
					 err => {
					     if(err) return console.log(err);
					     // console.log("Compiled contract saved!");
					 });
			    resolve();
			}
		    }
		}
	    ]));
	});
    },
    getContract : function (web3, fs, contractName) {
	var address = fs.readFileSync('./deployed/'+contractName+'.addr', 'utf8');
	var contractCompiled = JSON.parse(fs.readFileSync(
	    './deployed/'+contractName+'.json', 'utf8'));
	var contractName_c = Object.keys(contractCompiled).filter( (c_name) => {
	    return c_name.match(contractName) != null; } )[0]
	return web3.eth.contract(contractCompiled[contractName_c].info.abiDefinition).at(address);
    },
};
