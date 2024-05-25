import { Address, Cell, Contract, ContractProvider, SendMode, Sender, beginCell, contractAddress } from "@ton/core";

export type MainContractConfig = {
    number: number;
    address: Address;
    owner_address: Address;
}

export function mainContractConfigToCell(config: MainContractConfig): Cell {
    return beginCell()
        .storeUint(config.number, 32)
        .storeAddress(config.address)
        .storeAddress(config.owner_address)
        .endCell();
}

export class MainContract implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell, data: Cell }
    ) {

    }

    static createFromConfig(config: MainContractConfig, code: Cell, workchain = 0) {
        const data = mainContractConfigToCell(config);
        const init = { code, data };
        const address = contractAddress(workchain, init);

        return new MainContract(address, init)
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        const bodyCell = beginCell();
        
        await provider.internal(via, {
            value, 
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: bodyCell.storeUint(2, 32).endCell()
        });
    }

    async sendIncrementInternalMessage(
        provider: ContractProvider,
        sender: Sender,
        value: bigint,
        amountToAdd: number) {
        
        const bodyCell = beginCell();
        
        const op = 1;

        bodyCell.storeUint(op, 32);
        bodyCell.storeUint(amountToAdd, 32);

        await provider.internal(sender, {
            value, 
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: bodyCell.endCell()
        });
    }

    async sendDepositInternalMessage(
        provider: ContractProvider,
        sender: Sender,
        value: bigint) {
        
        const bodyCell = beginCell();
        
        const op = 2;

        bodyCell.storeUint(op, 32);

        await provider.internal(sender, {
            value, 
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: bodyCell.endCell()
        });
    }

    async sendNoOpCodeDepositInternalMessage(
        provider: ContractProvider,
        sender: Sender,
        value: bigint) {
        
        const bodyCell = beginCell();
        
        await provider.internal(sender, {
            value, 
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: bodyCell.endCell()
        });
    }

    async sendWisdrawalInternalMessage(
        provider: ContractProvider,
        sender: Sender,
        value: bigint,
        amount: bigint) {
        
        const bodyCell = beginCell();
        
        const op = 3;
    
        bodyCell.storeUint(op, 32);    
        bodyCell.storeCoins(amount)    

        await provider.internal(sender, {
            value, 
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: bodyCell.endCell()
        });
    }

    async sendDestroyInternalMessage(
        provider: ContractProvider,
        sender: Sender,
        value: bigint) {
        
        const bodyCell = beginCell();
        
        const op = 4;
    
        bodyCell.storeUint(op, 32);    

        await provider.internal(sender, {
            value, 
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: bodyCell.endCell()
        });
    }

    async getData(provider: ContractProvider) {
        const { stack } = await provider.get("get_contract_storage_data", []);
        return {
            number: stack.readNumber(),
            recent_sender: stack.readAddress(),
            owner_address: stack.readAddress(),
        }
    }

    async getBalance(provider: ContractProvider) {
        const { stack } = await provider.get("get_balance_data", []);
        return {
            balance: stack.readNumber(),
        }        
    }
}