
import { test, expect } from "bun:test";
import { LiteSVM } from "litesvm";
import {
    PublicKey,
    Transaction,
    SystemProgram,
    Keypair,
    LAMPORTS_PER_SOL,
    TransactionInstruction,
} from "@solana/web3.js";

test("cpi working as expected", () => {
    const svm = new LiteSVM();

    let cpiKeypair = PublicKey.unique();
    svm.addProgramFromFile(cpiKeypair, "./cpi.so");
    let contractKeypair = Keypair.generate();
    svm.addProgramFromFile(contractKeypair.publicKey, "./contractor.so");

    const userAcc = new Keypair();
    svm.airdrop(userAcc.publicKey, BigInt(LAMPORTS_PER_SOL));

    const dataAccount = createDataAccountOnChain(svm, userAcc, contractKeypair);

    expect(svm.getBalance(dataAccount.publicKey)).toBe(svm.minimumBalanceForRentExemption(BigInt(4)));

    function harder_trier() {

        const blockhash2 = svm.latestBlockhash();
        const ixn2 = new TransactionInstruction({
            keys: [{
                pubkey: dataAccount.publicKey,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: contractKeypair.publicKey,
                isSigner: false,
                isWritable: false,
            }
            ],
            programId: cpiKeypair,
            data: Buffer.from(""),
        });

        const tx2 = new Transaction();
        tx2.recentBlockhash = blockhash2;
        tx2.add(ixn2);
        tx2.feePayer = userAcc.publicKey;

        tx2.sign(userAcc);
        svm.sendTransaction(tx2);
        svm.expireBlockhash();
    }

    harder_trier();
    harder_trier();
    harder_trier();
    harder_trier();

    console.log(svm.getAccount(dataAccount.publicKey)?.data);
});


function createDataAccountOnChain(svm: LiteSVM, userAcc: Keypair, contract_keypair: Keypair) {
    const dataAccount = new Keypair();

    const blockhash = svm.latestBlockhash();
    const ixs = [
        SystemProgram.createAccount({
            fromPubkey: userAcc.publicKey,
            newAccountPubkey: dataAccount.publicKey,
            lamports: Number(svm.minimumBalanceForRentExemption(BigInt(4))),
            space: 4,
            programId: contract_keypair.publicKey
        }),
    ];

    const tx = new Transaction();
    tx.recentBlockhash = blockhash;
    tx.add(...ixs);
    tx.feePayer = userAcc.publicKey;

    // Data account is required to be a signer of the transaction along with the payer to - consent to assigning its owner
    tx.sign(userAcc, dataAccount);
    svm.sendTransaction(tx);
    svm.expireBlockhash()

    return dataAccount;
}

