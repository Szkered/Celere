pragma solidity ^0.4.2;

contract owned{
  address owner;
  
  function owned() {
    owner = msg.sender;
  }
  
  modifier onlyowner() {
      if(msg.sender!=owner) throw; _;
  }

  function getOwner() constant returns (address) {
      return owner;
  }

}

contract mortal is owned {
  function kill() {
    if (msg.sender == owner) suicide(owner); 
  }
}

/* To be deploy by PaymentAgent, so that no human has owner access */
contract Stash is mortal {
    bytes32 public bankName;
    int public balance;
    int public position;

    function Stash(bytes32 _bankName, int _balance) {
	bankName = _bankName;
	balance = _balance;
	position = _balance;
    }

    function credit(int _crAmt) onlyowner {
	balance += _crAmt;
    }

    function debit(int _dAmt) onlyowner {
	balance -= _dAmt;
    }

    function safe_debit(int _dAmt) onlyowner {
	if (_dAmt > balance) throw;
	balance -= _dAmt;
    }

    function inc_position(int amt) onlyowner {
	position += amt;
    }

    function dec_position(int amt) onlyowner {
	position -= amt;
    }

    function getBalance() constant returns (int) {
    	return balance;
    }

    function getPosition() constant returns (int) {
    	return position;
    }

    function isSolvent() constant returns (bool) {
    	return position >= 0;
    }
}


/* To be deploy by regulator, so that regulator has owner access */
contract TransactionAgent is mortal {
    bytes32 private ownedStash;
    mapping (bytes32 => address) public stashRegistry;
    bool resolving; 		/* true when resolving gridlock */
    uint maxQueueLen;

    enum TxState { Active, Inactive, Locked };
    
    struct Tx {
        bytes32 txRef; 
        bytes32 sender;
        bytes32 receiver;
        int amount;
	TxState state;
    }

    Tx[] public txQueue; /* 0-indexed array */

    modifier isInvoled(bytes32 _sender, bytes32 _receiver) {
	if(ownedStash == _sender || ownedStash == _receiver) _;
    }

    modifier isPositive(int _amount) { if (_amount < 0 ) throw; }

    function TransactionAgent(uint _maxQueueLen) {
	owner = msg.sender;
	ownedStash = "";
	resolving = False;
	maxQueueLen = _maxQueueLen;
    }

    function iterateMembers() {
	for(uint i=0;i<memberCount;i++)
	    {
		doSomeStuff(members[i]);
	    }
    }

    function changeOwner(address _newOwner) onlyowner {
	owner = _newOwner;
    }

    /* @deployment:
       privateFor = everyone  */
    function registerStash(bytes32 _bankName, address _addr) onlyowner {
	stashRegistry[_bankName] = _addr;
    }
    
    /* @depolyment:
       privateFor = MAS and owner node */
    function markStash(bytes32 _bankName) onlyowner {
	ownedStash = _bankName;
    }

    /* @live:
       privateFor = MAS and participating node */
    function submitTx(bytes32 _txRef, bytes32 _sender, bytes32 _receiver, int _amount)
	isPositive(_amount) isInvoled(_sender, _receiver) external returns(uint) {
	txQueue.length++;
	txQueue[txQueue.length-1].txRef = _txRef;
	txQueue[txQueue.length-1].sender = _sender;
	txQueue[txQueue.length-1].receiver = _receiver;
	txQueue[txQueue.length-1].amount = _amount;
	txQueue[txQueue.length-1].state = TxState.Active;
	/* update position */
	stashRegistry[_sender].dec_position(_amount);
	stashRegistry[_receiver].inc_position(_amount);
	/* decide whether to resolve gridlock */
	if (txQueue.length >= maxQueueLen) {
	    resolve();
	}
	return txQueue.length;
    }


    /* @depolyment, @live:
       privateFor = MAS and participating node */
    function transfer(bytes32 _src, bytes32 _dest, int _amount) {
    	Stash src = Stash(stashRegistry[_src]);
	Stash dest = Stash(stashRegistry[_dest]);
	if (_src == ownedStash) {
	    src.safe_debit(_amount);
	} else {
	    src.debit(_amount);
	}
	dest.credit(_amount);
    }

    /* @depolyment:
       privateFor == MAS and owner node
       amount == 0
       
       @live:
       privateFor == MAS and owner node */
    function pledge(bytes32 _bankName, int _amount) {
	Stash stash = Stash(stashRegistry[_bankName]);
	stash.credit(_amount);
    }

    /* @live:
       privateFor = MAS and owner node */
    function redeem(bytes32 _bankName, int _amount) {
	Stash stash = Stash(stashRegistry[_bankName]);
	stash.safe_debit(_amount);
    }

    /* @live:
       for stashes not owned by you this returns the net bilateral position */
    function getStash(bytes32 _bankName) constant returns (int) {
	Stash stash = Stash(stashRegistry[_bankName]);
	return stash.getBalance();
    }

    function getQueueLength() public constant returns(uint) {
        return txQueue.length;
    }
}


/* Public contract for holding RefData */
contract RefData is mortal {
    
    struct transaction {
	bool exists;
	uint timestamp;
	bool active;
    }

    struct Bank {
	string name;
	bool authorized;
	bool exists;
	address authorizedSender;
    }

    address public regulator;
    
    mapping (bytes32 => transaction) public transactions;
    
    mapping (address => Bank) public banks;
    
    function addTransaction (bytes32 _transactionID) {
        transactions[_transactionID].exists=true;
        transactions[_transactionID].timestamp=block.timestamp;
        transactions[_transactionID].active=true;
    }

    function getTransactionExistance (bytes32 _transactionID) public constant 
	returns (bool) {
        return (transactions[_transactionID].exists);
    }

    function getTransactionState (bytes32 _transactionID) public constant 
	returns (bool) {
        return (transactions[_transactionID].blocked);
    }

    function getTransactionTimestamp (bytes32 _transactionID) public constant 
	returns (uint) {
        return (transactions[_transactionID].timestamp);
    }

    function bankExist (address _contract) public constant 
	returns (bool) {
        return (banks[_contract].exists);
    }

    function bankAuthorized (address _contract) public constant 
	returns (bool) {
        return (banks[_contract].authorized);
    }

    function getBankSender (address _contract) public constant 
	returns (address) {
        return (banks[_contract].authorizedSender);
    }

    function activate(bytes32 _transactionID) onlyowner {
	if (transactions[_transactionID].exists) {
	    transactions[_transactionID].active=true;
	}
    }

    function inactivate(bytes32 _transactionID) onlyowner {
	if (transactions[_transactionID].exists) {
	    transactions[_transactionID].active=false;
	}
    }

    function addBank (string _name, address _contract, address _sender) onlyowner {
	banks[_contract].name=_name;
	banks[_contract].exists=true;
	banks[_contract].authorized=true;
	banks[_contract].authorizedSender=_sender;
    }

    function blockBank (address _contract) onlyowner {
	banks[_contract].authorized=false;
    }

    function unblockBank (address _contract) onlyowner {
	banks[_contract].authorized=true;
    }

}
