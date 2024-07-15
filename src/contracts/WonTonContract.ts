import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    Slice
} from '@ton/core';
import { crc32 } from '../../libs/Crc32';

export type WonTonConfig = {
    admin_address: Address;
};

export function wonTonConfigToCell(config: WonTonConfig): Cell {
    return beginCell()
            .storeAddress(config.admin_address)
            .storeRef(beginCell().storeDict<number, Slice>().endCell())
        .endCell();
}

export const Opcodes = {
    bet: crc32("op::bet"),      //0x9b0663d8
    play: crc32("op::play"),    //0xb13c381f,
};

export class WonTonContract implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {
    }

    static createFromAddress(address: Address) {
        return new WonTonContract(address);
    }

    static createFromConfig(config: WonTonConfig, code: Cell, workchain = 0) {
        const data = wonTonConfigToCell(config);
        const init = {code, data};
        return new WonTonContract(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendBet(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            queryID?: number;
            wontonPower: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.bet, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeUint(opts.wontonPower, 32)
                .endCell(),
        });
    }

    async getData(provider: ContractProvider, wontonPower: bigint) {
        const result = await provider.get('get_information', [{ type: "int", value: wontonPower }]);
        return {
            first_bettor: result.stack?.readAddressOpt(),
            second_bettor: result.stack?.readAddressOpt(),
            bettors_count: result.stack?.readNumber()
        };
    }

    async getBalance(provider: ContractProvider) {
        const result = await provider.get('get_contract_balance', []);
        return BigInt(result.stack?.readNumber());
    }
}