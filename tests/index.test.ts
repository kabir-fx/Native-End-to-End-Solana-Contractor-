import { test, expect } from "bun:test";
import { LiteSVM } from "litesvm";
import {
    PublicKey,
    Transaction,
    SystemProgram,
    Keypair,
    LAMPORTS_PER_SOL,
} from "@solana/web3.js";

test("Intializing a new Data Account", () => {
    const svm = new LiteSVM();

    const contract_keypair = Keypair.generate();
    svm.addProgramFromFile(contract_keypair.publicKey, "./contractor.so")

    const payer = new Keypair();

    const data_account = new Keypair();
    svm.airdrop(payer.publicKey, BigInt(LAMPORTS_PER_SOL));

    const blockhash = svm.latestBlockhash();
    const ixs = [
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: data_account.publicKey,
            lamports: Number(svm.minimumBalanceForRentExemption(BigInt(4))),
            space: 4,
            programId: contract_keypair.publicKey
        }),
    ];

    const tx = new Transaction();
    tx.recentBlockhash = blockhash;
    tx.add(...ixs);
    tx.feePayer = payer.publicKey;

    // Data account is required to be a signer of the transaction along with the payer to - consent to assigning its owner
    tx.sign(payer, data_account);
    svm.sendTransaction(tx);
    
    const balanceAfter = svm.getBalance(data_account.publicKey);
    expect(balanceAfter).toBe(svm.minimumBalanceForRentExemption(BigInt(4)));
});