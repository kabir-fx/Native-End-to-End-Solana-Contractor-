use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo}, entrypoint::ProgramResult, entrypoint, instruction::{AccountMeta, Instruction}, msg, program::invoke, pubkey::Pubkey
};

entrypoint!(process_instruction);

#[derive(BorshSerialize, BorshDeserialize)]
struct AccountData {
    count: u32,
}

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8]
) -> ProgramResult {
    let mut iter = accounts.iter();
    let data_account = next_account_info(&mut iter)?;
    let middle_account = next_account_info(&mut iter)?;

    let instruction = Instruction {
        program_id: *middle_account.key,
        accounts: vec![AccountMeta {
            // Here we are describing the metadata about the account we are transporting/transfering i.e the wallet account
            pubkey: *data_account.key,
            is_signer: false,
            is_writable: true,
        }],
        // Instruction Data
        data: vec![],
    };

    invoke(&instruction, &vec![data_account.clone()])?;

    Ok(())
}