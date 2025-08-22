import * as borsh from "borsh";

export class CounterAccount {
    number: number;

    constructor({ number }: { number: number }) {
        this.number = number;
    }
}

export const schema: borsh.Schema = {
    struct: {
        number: 'u32',
    }
}

export const NUMBER_SIZE = borsh.serialize(schema, new CounterAccount({ number: 0 })).length;
