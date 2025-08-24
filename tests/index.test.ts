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

test("Intialize Data Account", () => {
    const svm = new LiteSVM();
    
    const lamports = Number(svm.minimumBalanceForRentExemption(BigInt(4)));
    
    const payer = new Keypair();
    svm.airdrop(payer.publicKey, BigInt(LAMPORTS_PER_SOL));
    const contractor = PublicKey.unique();
    const middle_account = PublicKey.unique();
    
    const data_account = createDataAccount(svm, contractor, payer, lamports);
    
    svm.addProgramFromFile(contractor, './counter.so');
    svm.addProgramFromFile(middle_account, './cpi.so');
    
    expect(svm.getAccount(data_account.publicKey)?.lamports).toBe(lamports);
    
    sendTransactionToCpi(svm, contractor, payer, data_account, contractor);
    sendTransactionToCpi(svm, contractor, payer, data_account, contractor);
    sendTransactionToCpi(svm, contractor, payer, data_account, contractor);
    sendTransactionToCpi(svm, contractor, payer, data_account, contractor);
    
    console.log(svm.getAccount(data_account.publicKey)?.data);
});

function createDataAccount(svm: LiteSVM, contractor: PublicKey, payer: Keypair, lamports: number) {
    const data_account = Keypair.generate();

    const blockhash = svm.latestBlockhash();
    const ixs = [
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: data_account.publicKey,
            lamports: lamports,
            space: 4,
            programId: contractor
        }),
    ];

    const tx = new Transaction();
    tx.recentBlockhash = blockhash;
    tx.add(...ixs);
    tx.feePayer = payer.publicKey;
    tx.sign(payer, data_account);
    svm.sendTransaction(tx);
    svm.expireBlockhash();

    return data_account
}

function sendTransactionToContractor(svm: LiteSVM, contractor: PublicKey, payer: Keypair, data_account: Keypair) {
    const blockhash = svm.latestBlockhash();
    const ixs = new TransactionInstruction({
        keys: [{
            pubkey: data_account.publicKey,
            isSigner: false,
            isWritable: true
        }],
        data: new Buffer(""),
        programId: contractor
    });

    const tx = new Transaction();
    tx.recentBlockhash = blockhash;
    tx.add(ixs);
    tx.feePayer = payer.publicKey;
    tx.sign(payer);
    svm.sendTransaction(tx);
    svm.expireBlockhash();
}

function sendTransactionToCpi(svm: LiteSVM, middle_account: PublicKey, payer: Keypair, data_account: Keypair, contractor: PublicKey) {
    const blockhash = svm.latestBlockhash();
    const ixs = new TransactionInstruction({
        keys: [{
            pubkey: data_account.publicKey,
            isSigner: false,
            isWritable: true
        },{
            pubkey: contractor,
            isSigner: false,
            isWritable: false
        }],
        data: new Buffer(""),
        programId: middle_account
    });

    const tx = new Transaction();
    tx.recentBlockhash = blockhash;
    tx.add(ixs);
    tx.feePayer = payer.publicKey;
    tx.sign(payer);
    svm.sendTransaction(tx);
    svm.expireBlockhash();
}
