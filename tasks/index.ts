import { BigNumber } from 'ethers'
// import { ethers } from 'hardhat'
import { task } from 'hardhat/config'
import { createGetHreByEid, createProviderFactory, getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import { Options } from '@layerzerolabs/lz-v2-utilities'

// npx hardhat onft:mint --contract 0xbE47555Dd34A9Ed28533218eDe3981514A60f3cB --to 0xB31C5881957770b304dE2B896dC310B977564A84 --token-id 6 --network-name avalanche-testnet
task('onft:mint', 'Mint a new ONFT token')
    .addParam('contract', 'The ONFT contract address')
    .addParam('to', 'The recipient address')
    .addParam('tokenId', 'The token ID to mint')
    .addParam('networkName', 'The network name where the contract is deployed') // Changed from 'network' to 'networkName'
    .setAction(async (taskArgs, { ethers }) => {
        const eid = getEidForNetworkName(taskArgs.networkName) // Changed to 'networkName'
        const contractAddress = taskArgs.contract
        const environmentFactory = createGetHreByEid()
        const providerFactory = createProviderFactory(environmentFactory)
        const signer = (await providerFactory(eid)).getSigner()

        const onftContractFactory = await ethers.getContractFactory('MyONFT721', signer)
        const onftContract = onftContractFactory.attach(contractAddress)

        const mintTx = await onftContract.mint(taskArgs.to, taskArgs.tokenId, {
            gasLimit: 3000000, // Set gas limit here (you can adjust this value as needed)
        })
        await mintTx.wait()
        console.log(`Token with ID ${taskArgs.tokenId} minted to ${taskArgs.to}. \nTx hash: ${mintTx.hash}`)
    })

// npx hardhat onft:mint --contract 0xbE47555Dd34A9Ed28533218eDe3981514A60f3cB --to 0xB31C5881957770b304dE2B896dC310B977564A84 --quantity 3 --network-name avalanche-testnet
task('onft:mint_initial', 'Mint a specified number of ONFT tokens')
    .addParam('contract', 'The ONFT contract address')
    .addParam('to', 'The recipient address')
    .addParam('quantity', 'The number of tokens to mint') // Number of tokens to mint
    .addParam('networkName', 'The network name where the contract is deployed') // Changed from 'network' to 'networkName'
    .setAction(async (taskArgs, { ethers }) => {
        const eid = getEidForNetworkName(taskArgs.networkName) // Changed to 'networkName'
        const contractAddress = taskArgs.contract
        const environmentFactory = createGetHreByEid()
        const providerFactory = createProviderFactory(environmentFactory)
        const signer = (await providerFactory(eid)).getSigner()

        const onftContractFactory = await ethers.getContractFactory('MyONFT721', signer)
        const onftContract = onftContractFactory.attach(contractAddress)

        // Loop to mint the specified quantity of tokens, starting with token ID 1
        for (let i = 1; i <= taskArgs.quantity; i++) {
            const mintTx = await onftContract.mint(taskArgs.to, i, {
                gasLimit: 3000000, // Set gas limit here (you can adjust this value as needed)
            })
            await mintTx.wait()
            console.log(`Token with ID ${i} minted to ${taskArgs.to}. \nTx hash: ${mintTx.hash}`)
        }
    })

task('onft:quote_send', 'Send ONFT cross-chain using LayerZero technology')
    .addParam('contract', 'The ONFT contract address on network A')
    .addParam('to', 'The recipient address on network B')
    .addParam('networkFrom', 'The name of network A')
    .addParam('networkTo', 'The name of network B')
    .addParam('tokenId', 'The token ID of the ONFT to transfer')
    .addParam('privateKey', 'The private key of the sender')
    .setAction(async (taskArgs, { ethers }) => {
        const eidA = getEidForNetworkName(taskArgs.networkFrom)
        const eidB = getEidForNetworkName(taskArgs.networkTo)
        console.log('EID A:', eidA)
        console.log('EID B:', eidB)
        const contractA = taskArgs.contract
        const recipientB = taskArgs.to
        const environmentFactory = createGetHreByEid()
        const providerFactory = createProviderFactory(environmentFactory)
        const provider = await providerFactory(eidA)
        const wallet = new ethers.Wallet(taskArgs.privateKey, provider)

        const onftContractFactory = await ethers.getContractFactory('MyONFT721', wallet)
        const onft = onftContractFactory.attach(contractA)

        // const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString()
        const recipientAddressBytes32 = ethers.utils.hexZeroPad(recipientB, 32)

        // Prepare send parameters
        const sendParam = [eidB, recipientAddressBytes32, taskArgs.tokenId, '0x', '0x', '0x']

        // Estimate the fee
        const quote = await onft.quoteSend(sendParam, false)
        const fee = {
            nativeFee: quote.nativeFee,
            lzTokenFee: quote.lzTokenFee,
        }
        console.log(`Quote result: ${ethers.utils.formatEther(fee.nativeFee)} ETH`)
        console.log(`Quote result: ${ethers.utils.formatUnits(fee.nativeFee, 'gwei')} gwei`)

        // Fetch the current gas price and nonce
        // Setting the gas price so that total cost is 0.01 ETH
        const gasLimit = 15000000 // For example, adjust based on your needs
        const gasPrice = ethers.utils.parseUnits('33.33', 'gwei')
        // const gasPrice = await provider.getGasPrice()
        const nonce = await provider.getTransactionCount(wallet.address)
    })



task('lz:onft:send', 'Send an ONFT from one network to another using LayerZero technology')
    .addParam('contractA', 'ONFT contract address on network A')
    .addParam('contractB', 'ONFT contract address on network B')
    .addParam('networkA', 'Name of network A')
    .addParam('networkB', 'Name of network B')
    .addParam('tokenId', 'The token ID of the ONFT to transfer')
    .setAction(async (taskArgs, { ethers }) => {
        const eidA = getEidForNetworkName(taskArgs.networkA)
        const eidB = getEidForNetworkName(taskArgs.networkB)
        const contractA = taskArgs.contractA
        const contractB = taskArgs.contractB
        const environmentFactory = createGetHreByEid()
        const providerFactory = createProviderFactory(environmentFactory)
        const signer = (await providerFactory(eidA)).getSigner()

        const onftContractFactory = await ethers.getContractFactory('MyONFT721', signer)
        const onft = onftContractFactory.attach(contractA)

        const sendParam = [
            eidB, // Destination network ID
            ethers.utils.hexZeroPad(contractB, 32), // Contract on network B as bytes32
            taskArgs.tokenId, // The ONFT token ID to transfer
            '0x', // Placeholder for possible message
            '0x', // Placeholder for additional options
            '0x', // LayerZero execution options
        ]

        // Estimate the fee for the transfer
        const [nativeFee] = await onft.quoteSend(sendParam, false)

        // print price details in MATIC and USD
        console.log(`Native fee: ${ethers.utils.formatEther(nativeFee)} MATIC`)
        console.log(`Native fee: ${ethers.utils.formatUnits(nativeFee, 'gwei')} gwei`)
        

        const sender = await signer.getAddress()
        console.log({ eidA, eidB, contractA, contractB, tokenId: taskArgs.tokenId, sender, nativeFee })
        console.log(`Transferring ONFT with token ID ${taskArgs.tokenId} from network ${taskArgs.networkA} to ${taskArgs.networkB}`)

        // Execute the ONFT transfer
        try {
            const tx = await onft.send(sendParam, [nativeFee, 0], sender, { value: nativeFee })
            console.log(`Tx initiated. View on LayerZero Scan: https://testnet.layerzeroscan.com/tx/${tx.hash}`)

            // Print more information from the transaction receipt
            const receipt = await tx.wait();
            console.log('Transaction was mined in block number:', receipt.blockNumber)
            console.log('Gas used for this transaction:', receipt.gasUsed.toString())
            console.log('Transaction status (1 = success, 0 = fail):', receipt.status)
            console.log('Events emitted during this transaction:')
            receipt.events.forEach((event) => {
                console.log(`Event ${event.event}:`, event.args)
            })
        } catch (error) {
            console.error('Error sending ONFT:', error)
        }
    })

task('onft:sendToUser', 'Send an ONFT from the contract to a user')
    .addParam('contract', 'ONFT contract address')
    .addParam('recipient', 'Recipient address (user)')
    .addParam('networkName', 'The name of the network')
    .addParam('tokenId', 'The token ID of the ONFT to transfer')
    .setAction(async (taskArgs, { ethers }) => {
        const eid = getEidForNetworkName(taskArgs.networkName) // Get the network ID
        const contractAddress = taskArgs.contract // ONFT contract address
        const recipient = taskArgs.recipient // Recipient's address (user)

        const environmentFactory = createGetHreByEid()
        const providerFactory = createProviderFactory(environmentFactory)
        const signer = (await providerFactory(eid)).getSigner() // Get the signer for this network

        const onftContractFactory = await ethers.getContractFactory('MyONFT721', signer)
        const onft = onftContractFactory.attach(contractAddress)

        // Log transfer details
        console.log({
            network: taskArgs.networkName,
            contract: contractAddress,
            recipient: recipient,
            tokenId: taskArgs.tokenId,
        })

        console.log(
            `Sending ONFT with token ID ${taskArgs.tokenId} from contract to user ${recipient} on network ${taskArgs.networkName}`
        )

        // Execute the transfer using the `sendTo` function in your contract
        try {
            const tx = await onft.sendTo(recipient, taskArgs.tokenId, {
                gasLimit: 3000000, // Adjust as needed based on gas requirements
            })
            console.log(`Tx initiated. Tx hash: ${tx.hash}`)
            await tx.wait()
            console.log(`ONFT with token ID ${taskArgs.tokenId} sent to ${recipient} successfully.`)
        } catch (error) {
            console.error('Error sending ONFT to user:', error)
        }
    })
