const { assert } = require("chai")
const { getNamedAccounts, network } = require("hardhat")

const chainId = network.config.chainId
if (chainId == "31337") {
    describe.skip
} else {
    describe("FundMe", async function () {
        let fundMe
        let deployer
        const sendValue = ethers.utils.parseEther("1")
        beforeEach(async function () {
            deployer = (await getNamedAccounts).deployer
            fundMe = await ethers.getContract("FundMe", deployer)
        })

        it("allows people to fund and withdraw", async function () {
            await fundMe.fund({ value: sendValue })
            await fundMe.withdraw()
            const endingBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            assert.equal(endingBalance.toString(), "0")
        })
    })
}
