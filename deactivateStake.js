const { Connection, PublicKey, Account, sendAndConfirmTransaction, StakeProgram, SystemProgram } = require('@solana/web3.js');

// Function to get user input
async function getUserInput(prompt) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    readline.question(prompt, (answer) => {
      readline.close();
      resolve(answer);
    });
  });
}

// Asynchronous main function
async function main() {
  // Initialize Solana connection for Mainnet
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

  // Prompt user for wallet private key
  const privateKey = await getUserInput('Enter your wallet private key: ');
  const wallet = new Account(Buffer.from(privateKey, 'hex'));

  // Prompt user for stake account public key
  const stakeAccountPublicKeyStr = await getUserInput('Enter your stake account public key: ');
  const stakeAccountPublicKey = new PublicKey(stakeAccountPublicKeyStr);

  // Check the current authorized staker
  const stakeAccountInfo = await connection.getAccountInfo(stakeAccountPublicKey);
  const authorizedPubkey = new PublicKey(stakeAccountInfo.data.slice(12, 44));

  if (!authorizedPubkey.equals(wallet.publicKey)) {
    console.error('Error: Your wallet is not authorized to deactivate this stake account.');
    return;
  }

  // Confirm with the user before deactivating the stake account
  const confirmation = await getUserInput('Are you sure you want to deactivate the stake account? (yes/no): ');
  if (confirmation.toLowerCase() !== 'yes') {
    console.log('Deactivation canceled by the user.');
    return;
  }

  // Deactivate the stake account
  const deactivateTx = StakeProgram.deactivate({
    stakePubkey: stakeAccountPublicKey,
    authorizedPubkey: wallet.publicKey,
  });

  const deactivateTxId = await sendAndConfirmTransaction(connection, deactivateTx, [wallet], {
    commitment: 'confirmed',
  });
  console.log(`Stake account deactivated. Tx Id: ${deactivateTxId}`);

  // Confirm that the stake account balance is now 0
  const stakeBalance = await connection.getBalance(stakeAccountPublicKey);
  console.log(`Stake account balance: ${stakeBalance / 1e9} SOL`);

  // Close the connection or perform any necessary cleanup
  // connection.close(); // Uncomment if needed
}

// Call the asynchronous main function
main().catch((error) => console.error(error));
