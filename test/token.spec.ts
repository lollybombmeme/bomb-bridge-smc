import hardhat from 'hardhat'
import { Token } from '../typechain-types';
import * as chai from 'chai'
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

const { ethers } = hardhat

describe('Token', async function () {
    let TokenSmc: Token

    let tokenName = "MyToken"
    let tokenSymbol = "MTK"
    let tokenDecimals = 18

    let owner: HardhatEthersSigner
    let user: HardhatEthersSigner

    before(async function () {
        [owner, user] = await ethers.getSigners();

        const TokenContractFactory = await ethers.getContractFactory("Token")
        TokenSmc = await TokenContractFactory.deploy("MyToken", "MTK");
    });

    it('Token utility', async () => {
        chai.expect(await TokenSmc.name()).equal(tokenName, "Token name's invalid")
        chai.expect(await TokenSmc.symbol()).equal(tokenSymbol, "Token symbol's invalid")
        chai.expect(await TokenSmc.decimals()).equal(tokenDecimals, "Token decimals's invalid")
    });

    it('Mint', async () => {
        chai.expect(await TokenSmc.balanceOf(owner.address)).equal(0n, "After mint: Invalid balance")
        const mintAmount = ethers.parseEther("100")

        await TokenSmc.mint(owner.address, mintAmount)
        chai.expect(await TokenSmc.balanceOf(owner.address)).equal(mintAmount, "Before mint: Invalid balance")
    });

    it('Mint unauthorized', async () => {
        chai.expect(await TokenSmc.balanceOf(user.address)).to.equal(0n, "After mint: Invalid balance");
        const mintAmount = ethers.parseEther("100")
        await chai.expect(TokenSmc.connect(user).mint(user.address, mintAmount)).to.be.rejectedWith("Unauthorized");
    });

    it('Burn', async () => {
        const preBalance = await TokenSmc.balanceOf(owner.address)
        const burnAmount = ethers.parseEther("1")
        await TokenSmc.burn(owner.address, burnAmount);
        chai.expect(await TokenSmc.balanceOf(owner.address)).equal(preBalance - burnAmount, "Burn: Invalid balance")
    })

    it('Burn unauthorized', async () => {
        const burnAmount = ethers.parseEther("1")
        await chai.expect(TokenSmc.connect(user).burn(owner.address, burnAmount)).to.be.rejectedWith("Unauthorized")
    })
});