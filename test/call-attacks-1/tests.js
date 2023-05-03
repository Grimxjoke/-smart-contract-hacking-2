const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('Calls Attacks Exercise 1', function () {

    let deployer, user, attacker;

    before(async function () {
        /** SETUP EXERCISE - DON'T CHANGE ANYTHING HERE */

        [deployer, user, attacker] = await ethers.getSigners();

        // Deploy
        const UnrestrictedOwnerFactory = await ethers.getContractFactory(
            'contracts/call-attacks-1/UnrestrictedOwner.sol:UnrestrictedOwner',
            deployer
        );
        this.unrestrictedOwner = await UnrestrictedOwnerFactory.deploy();
        const RestrictedOwnerFactory = await ethers.getContractFactory(
            'contracts/call-attacks-1/RestrictedOwner.sol:RestrictedOwner',
            deployer
        );
        this.restrictedOwner = await RestrictedOwnerFactory.deploy(this.unrestrictedOwner.address);
        
        // Any user can take ownership on `UnrestrictedOwner` contract
        await expect(this.unrestrictedOwner.connect(user).changeOwner(user.address)).not.to.be.reverted;
        expect(await this.unrestrictedOwner.owner()).to.equal(user.address);

        // Any user can't take ownership on `RestrictedOwner` contract
        expect(this.restrictedOwner.connect(user).updateSettings(user.address, user.address)).to.be.reverted;
        expect(await this.restrictedOwner.owner()).to.equal(deployer.address);
        expect(await this.restrictedOwner.manager()).to.equal(deployer.address);
    });

    it('Exploit', async function () {
        /** CODE YOUR SOLUTION HERE */

    });

    after(async function () {
        /** SUCCESS CONDITIONS */
        
        // Attacker should take ownership on `RestrictedOwner` contract
        expect(await this.restrictedOwner.owner()).to.equal(attacker.address);
        expect(await this.restrictedOwner.manager()).to.equal(attacker.address);
    });
});
