// SPDX-License-Identifier: MIT

//pragma
pragma solidity ^0.8.8;

//imports
import "./PriceConverter.sol";
// import "hardhat/console.sol";

//Error codes
error FundMe__NotOwner();

//Interfaces, libraries, Contracts

/// @title A contract for crowd funding
/// @author Maverick
/// @notice This contract is to demo a sample funding contract
/// @dev This implements price feeds as our library

contract FundMe {
    //Type declarations
    using PriceConverter for uint256;

    //State variables
    mapping(address => uint256) private s_addressToAmountFunded;
    address[] private s_funders;

    address private immutable i_owner;
    uint256 public constant MINIMUM_USD = 50 * 1e18;

    AggregatorV3Interface private s_priceFeed;

    //Modifiers
    modifier onlyOwner() {
        //require(msg.sender == i_owner, "Sender is not owner!");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    //What happens if someone sends ETH to the contract without calling the fund function?

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /// @notice This function funds this contract
    /// @dev This implements price feeds as our library
    function fund() public payable {
        // console.log("Transfering %s tokens from %s", msg.value, msg.sender);
        // console.log("Sender's balance is %s", msg.sender.balance);
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Didn't send enough ether!"
        );
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        //resetting an array
        s_funders = new address[](0);

        //withdrawing funds
        //transfer
        // payable(msg.sender).transfer(address(this).balance);
        //send
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send Failed!");
        //call (lower level command)
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call Failed!");
        // msg.sender = type(address)
        // payable(msg.sender) = type(payable address)
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;
        //mappings can't be in memory
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        s_funders = new address[](0);
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed!");
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddresstoAmount(address funder) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
