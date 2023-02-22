const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { assert, expect } = require("chai")

const chainId = network.config.chainId
if (chainId != "31337") {
    describe.skip
} else {
    describe("FundMe", async function () {
        let fundMe
        let deployer
        let mockV3Aggregator
        const sendValue = ethers.utils.parseEther("1")
        beforeEach(async function () {
            //deploy our fundMe contract
            //using Hardhat deploy
            deployer = (await getNamedAccounts()).deployer
            await deployments.fixture(["all"])
            fundMe = await ethers.getContract("FundMe", deployer)
            mockV3Aggregator = await ethers.getContract(
                "MockV3Aggregator",
                deployer
            )
        })

        describe("constructor", async function () {
            it("correctly assigns the aggregator address", async function () {
                const response = await fundMe.getPriceFeed()
                assert.equal(response, mockV3Aggregator.address)
            })
        })

        describe("fund", async function () {
            it("Fails if you don't send enough ETH", async function () {
                await expect(fundMe.fund()).to.be.reverted
            })

            it("Updates the amount funded data structure", async function () {
                await fundMe.fund({ value: sendValue })
                const response = await fundMe.getAddresstoAmount(deployer)
                assert.equal(response.toString(), sendValue.toString())
            })
            it("Adds the sender to the array of funders", async function () {
                await fundMe.fund({ value: sendValue })
                const funder = await fundMe.getFunder(0)
                assert.equal(funder, deployer)
            })
        })

        describe("withdraw", async function () {
            beforeEach(async function () {
                await fundMe.fund({ value: sendValue })
            })

            it("Withdraw ETH from only the owner", async function () {
                //Arrange
                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const startingSenderBalance = await fundMe.provider.getBalance(
                    deployer
                )
                //Act
                const transactionResponse = await fundMe.withdraw()
                const transactionReceipt = await transactionResponse.wait(1)
                const { gasUsed, effectiveGasPrice } = transactionReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice)

                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )

                const endingSenderBalance = await fundMe.provider.getBalance(
                    deployer
                )
                //gasCost

                //Assert
                assert.equal(endingFundMeBalance, 0)
                assert.equal(
                    startingSenderBalance.add(startingFundMeBalance).toString(),
                    endingSenderBalance.add(gasCost).toString()
                )
            })

            it("it allows us to withdraw with multiple Funders", async function () {
                //Arrange
                const accounts = await ethers.getSigners()
                for (let i = 1; i < 6; i++) {
                    const fundMeConnectedContract = await fundMe.connect(
                        accounts[i]
                    )
                    await fundMeConnectedContract.fund({ value: sendValue })
                }
                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const startingSenderBalance = await fundMe.provider.getBalance(
                    deployer
                )

                //Act
                const transactionResponse = await fundMe.withdraw()
                const transactionReceipt = await transactionResponse.wait(1)
                const { gasUsed, effectiveGasPrice } = transactionReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice)

                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const endingSenderBalance = await fundMe.provider.getBalance(
                    deployer
                )

                //Assert
                assert.equal(endingFundMeBalance, 0)
                assert.equal(
                    startingFundMeBalance.add(startingSenderBalance).toString(),
                    endingSenderBalance.add(gasCost).toString()
                )

                await expect(fundMe.getFunder(0)).to.be.reverted

                for (let i = 1; i < 6; i++) {
                    assert.equal(
                        await fundMe.getAddresstoAmount(accounts[1].address),
                        0
                    )
                }
            })

            it("Only allows the owner to withdraw", async function () {
                const accounts = await ethers.getSigners()
                const attacker = accounts[1]
                const attackerConnectedContract = await fundMe.connect(attacker)
                await expect(
                    attackerConnectedContract.withdraw()
                ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
            })
            ////////////////////////////////////////////////////////////////////////

            it("Withdraw ETH from only the owner...(Cheaper version)", async function () {
                //Arrange
                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const startingSenderBalance = await fundMe.provider.getBalance(
                    deployer
                )
                //Act
                const transactionResponse = await fundMe.cheaperWithdraw()
                const transactionReceipt = await transactionResponse.wait(1)
                const { gasUsed, effectiveGasPrice } = transactionReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice)

                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )

                const endingSenderBalance = await fundMe.provider.getBalance(
                    deployer
                )
                //gasCost

                //Assert
                assert.equal(endingFundMeBalance, 0)
                assert.equal(
                    startingSenderBalance.add(startingFundMeBalance).toString(),
                    endingSenderBalance.add(gasCost).toString()
                )
            })

            it("cheaper withdraw testing.....", async function () {
                //Arrange
                const accounts = await ethers.getSigners()
                for (let i = 1; i < 6; i++) {
                    const fundMeConnectedContract = await fundMe.connect(
                        accounts[i]
                    )
                    await fundMeConnectedContract.fund({ value: sendValue })
                }
                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const startingSenderBalance = await fundMe.provider.getBalance(
                    deployer
                )

                //Act
                const transactionResponse = await fundMe.cheaperWithdraw()
                const transactionReceipt = await transactionResponse.wait(1)
                const { gasUsed, effectiveGasPrice } = transactionReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice)

                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const endingSenderBalance = await fundMe.provider.getBalance(
                    deployer
                )

                //Assert
                assert.equal(endingFundMeBalance, 0)
                assert.equal(
                    startingFundMeBalance.add(startingSenderBalance).toString(),
                    endingSenderBalance.add(gasCost).toString()
                )

                await expect(fundMe.getFunder(0)).to.be.reverted

                for (let i = 1; i < 6; i++) {
                    assert.equal(
                        await fundMe.getAddresstoAmount(accounts[1].address),
                        0
                    )
                }
            })
        })
    })
}
