import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode
} from '@ton/core';
import { crc32 } from '../../libs/Crc32';

export type WonTonConfig = {
    wonton_power: number
    admin_address: Address
};

export function wonTonConfigToCell(config: WonTonConfig): Cell {
    return beginCell()
        .storeUint(config.wonton_power, 8)
        .storeAddress(config.admin_address)
        .storeUint(0, 2)
        .storeRef(beginCell()
            .storeRef(beginCell().storeAddress(null).endCell())
            .storeRef(beginCell().storeAddress(null).endCell())
            .endCell())
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
            value: bigint
            queryID?: number
            provided_wonton_power: number
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.bet, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeUint(opts.provided_wonton_power, 8)
                .endCell(),
        });
    }

    async getInformation(provider: ContractProvider) {
        const result = await provider.get('get_information', []);

        return {
            wonton_power: result.stack?.readNumber(),
            bettors_count: result.stack?.readNumber(),
            first_bettor: result.stack?.readAddressOpt(),
            second_bettor: result.stack?.readAddressOpt()
        };
    }

    async getBalance(provider: ContractProvider) {
        const result = await provider.get('get_contract_balance', []);
        return BigInt(result.stack?.readNumber());
    }
}