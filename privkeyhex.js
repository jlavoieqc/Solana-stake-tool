const { Connection, PublicKey, Account, sendAndConfirmTransaction, SystemProgram } = require('@solana/web3.js');

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

  // Prompt user for withdrawal amount
  const withdrawalAmount = parseFloat(await getUserInput('Enter the amount to withdraw (in SOL): '));

  // Get recent blockhash
  const blockhash = (await connection.getRecentBlockhash('max')).blockhash;

  // Withdraw funds from the stake account
  const withdrawTx = await sendAndConfirmTransaction(
    connection,
    [
      // Withdraw from the stake account
      SystemProgram.transfer({
        fromPubkey: stakeAccountPublicKey,
        toPubkey: wallet.publicKey,
        lamports: withdrawalAmount * 1e9, // Convert SOL to lamports
      }),
    ],
    [wallet]
  );
  console.log(`Stake account withdrawn. Tx Id: ${withdrawTx}`);

  // Confirm that the stake account balance is now 0
  const stakeBalance = await connection.getBalance(stakeAccountPublicKey);
  console.log(`Stake account balance: ${stakeBalance / 1e9} SOL`);

  // Close the connection or perform any necessary cleanup
  // connection.close(); // Uncomment if needed
}

// Call the asynchronous main function
main().catch((error) => console.error(error));
