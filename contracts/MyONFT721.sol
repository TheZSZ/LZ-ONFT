// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { ONFT721 } from "@layerzerolabs/onft-evm/contracts/onft721/ONFT721.sol";

contract MyONFT721 is ONFT721 {
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate
    ) ONFT721(_name, _symbol, _lzEndpoint, _delegate) {}

    function mint(address to, uint256 tokenId) external virtual onlyOwner {
        _mint(to, tokenId);
    }

    // send nft from contract to a user after a cross chain transfer
    function sendTo(address recipient, uint256 tokenId) external virtual {
        // Check if the sender is the owner of the token or the owner of the contract
        if (ownerOf(tokenId) == msg.sender) {
            _transfer(msg.sender, recipient, tokenId);  // Normal transfer from token owner
        } else if (ownerOf(tokenId) == address(this) && owner() == msg.sender) {
            _transfer(address(this), recipient, tokenId);  // Transfer from the contract if the owner commands it
        } else {
            revert("Not authorized to transfer this token");
        }
    }
}
