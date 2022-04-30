const assert = require('assert');   //npm run test
const ganache = require('ganache-cli'); //local test network
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const {interface , bytecode} = require('../compile');

let lottery;  //hold instances of our contracts
let accounts;  // list of all the different accounts that were automatically generated and unlocked for us as a part of the ganache cli

beforeEach(async ()=>{   //attempt to deploy our contract and also get list of all of our accounts
  accounts = await web3.eth.getAccounts();

  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({data:bytecode})
    .send({from:accounts[0] , gas:'1000000'});
});

describe('Lottery Contract' , ()=>{
  it('deploys a contract',()=>{         //It statement is going to attempt to test some different aspect of our contract
    assert.ok(lottery.options.address);   //this is the address into which our contract is deployed into the local test network
  });

  it('allows one account to enter', async ()=>{
    await lottery.methods.enter().send({
      from:accounts[0],
      value: web3.utils.toWei('0.02','ether') //this function converts wei to ether
    });

    const players = await lottery.methods.getPlayers().call({
      from:accounts[0]
    });

    assert.equal(accounts[0], players[0]);
    assert.equal(1 , players.length);
  });

  it('allows multiple account to enter', async ()=>{
    await lottery.methods.enter().send({
      from:accounts[0],
      value: web3.utils.toWei('0.02','ether') //this function converts wei to ether
    });
    await lottery.methods.enter().send({
      from:accounts[1],
      value: web3.utils.toWei('0.02','ether') //this function converts wei to ether
    });
    await lottery.methods.enter().send({
      from:accounts[2],
      value: web3.utils.toWei('0.02','ether') //this function converts wei to ether
    });

    const players = await lottery.methods.getPlayers().call({
      from:accounts[0]
    });

    assert.equal(accounts[0], players[0]);
    assert.equal(accounts[1], players[1]);
    assert.equal(accounts[2], players[2]);
    assert.equal(3 , players.length);
  });

  it('requires a minimum amount of ether to enter', async()=>{
    try{
      await lottery,methods.enter().send({
        from:accounts[0],
        value:200  //200 wei ---less value than the contract condition
      });
      assert(false);   //this is used to fail our test---basically here we are checking if the lottery contract accepting eth less than 0.1 then it will fail the test telling somehitng is wrong with your solidity functon
    }catch(err){
      assert(err);   //check for truthiness unlike ok check for existence
    }
  });

  it('only manager can call pickWinner' , async()=>{
    try{
      await lottery.methods.pickWinner.send({
        from:accounts[1]
      });
      assert(false);    //if the code is reaching to this point, immedietly fails the test.
    }catch(err){
      assert(err);
    }
  });

  it('sends money to the winner and restes the players array' , async()=>{
    await lottery.methods.enter().send({
      from:accounts[0],
      value: web3.utils.toWei('2' , 'ether')
    });
    const initialBalance = await web3.eth.getBalance(accounts[0]);

    await lottery.methods.pickWinner().send({from:accounts[0]});

    const finalBalance = await web3.eth.getBalance(accounts[0]);  //diff between final balance & initial balance will be little less than 2 ether due to gas fees tp carry out the transaction

    const difference = finalBalance- initialBalance;
    // console.log(difference);
    assert(difference>web3.utils.toWei('1.8' , 'ether'));
  });
});
