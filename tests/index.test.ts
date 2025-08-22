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

test("Incrementing the Data Account", () => {
    const svm = new LiteSVM();

    const contract_keypair = Keypair.generate();
    svm.addProgramFromFile(contract_keypair.publicKey, "./contractor.so");

    const payer = new Keypair();
    svm.airdrop(payer.publicKey, BigInt(LAMPORTS_PER_SOL));

    const data_account = new Keypair();

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
    svm.expireBlockhash()

    const balanceAfter = svm.getBalance(data_account.publicKey);
    expect(balanceAfter).toBe(svm.minimumBalanceForRentExemption(BigInt(4)));
    
    // CUSTON PROGRAM INSTRUCTION
    function trier() {
        const blockhash2 = svm.latestBlockhash();
        const ixn2 = new TransactionInstruction({
            keys: [{
                pubkey: data_account.publicKey,
                isSigner: false,
                isWritable: true,
            }],
            programId: contract_keypair.publicKey,
            data: Buffer.from(""),
        });
    
        const tx2 = new Transaction();
        tx2.recentBlockhash = blockhash2;
        tx2.add(ixn2);
        tx2.feePayer = payer.publicKey;
    
        tx2.sign(payer);
        svm.sendTransaction(tx2);
        svm.expireBlockhash();
    }

    trier();
    trier();
    trier();
    trier();
    trier();

    const data = svm.getAccount(data_account.publicKey)?.data;
    // console.log(data);

    if (data) {
        expect(data[0]).toBe(16);
        expect(data[1]).toBe(0);
        expect(data[2]).toBe(0);
        expect(data[3]).toBe(0);
    }
});