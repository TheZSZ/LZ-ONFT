// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { MyONFT721 } from "../MyONFT721.sol";

// @dev WARNING: This is for testing purposes only
contract MyONFT721Mock is MyONFT721 {
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate
    ) MyONFT721(_name, _symbol, _lzEndpoint, _delegate) {}

    // @dev Override mint function to allow minting in tests
    function mint(address _to, uint256 _tokenId) public override {
        _mint(_to, _tokenId);
    }

    // @dev Simulate sending a token to another address
    function mockSendTo(address _recipient, uint256 _tokenId) public {
        require(ownerOf(_tokenId) == msg.sender, "Not token owner");
        _transfer(msg.sender, _recipient, _tokenId);
    }

    // @dev Override sendTo for mock behavior
    function sendTo(address recipient, uint256 tokenId) external override {
        // Mock sending functionality for testing
        _transfer(ownerOf(tokenId), recipient, tokenId);
    }

    // @dev Mock burn functionality for testing purposes
    function mockBurn(uint256 _tokenId) public {
        require(ownerOf(_tokenId) == msg.sender, "Not token owner");
        _burn(_tokenId);
    }
}
