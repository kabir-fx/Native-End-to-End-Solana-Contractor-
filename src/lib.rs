use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo}, entrypoint::ProgramResult, entrypoint, msg, pubkey::Pubkey
};

entrypoint!(process_instruction);

#[derive(BorshSerialize, BorshDeserialize)]
struct AccountData {
    count: u32,
}

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8]
) -> ProgramResult {
    // STAGE 1
    // In order to access the data accounts [accounts where we will actually be changing the data] present in the accounts parameter we need to call an interator to traverse thru the list
    let data_account = next_account_info(&mut accounts.iter())?;

    // Since it's of type - Rc<RefCell<&'a mut [u8]>> [for protection], we need to borrow the data in order to cautiously borrow the data
    let mut counter = AccountData::try_from_slice(&data_account.data.borrow_mut())?;

    // STAGE 2
    // Since the AccountData struct may be freshly created here [i.e it has 0 bytes] we need to first intialize it
    if counter.count == 0 {
        counter.count = 1;
    } else {
        counter.count *= 2;
    }

    // STAGE 3
    // Since .serialize expects: &mut [u8] we need to derefMut the RefMut by dereferencing the pointer
    counter.serialize(&mut *data_account.data.borrow_mut())?;

    Ok(())
}