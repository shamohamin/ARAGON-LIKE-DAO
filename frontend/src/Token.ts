export namespace TokenUtility {
    export const TokenHeaders: string = `
        #![allow(unused_variables)]
        #[macro_use]
        extern crate pbc_contract_codegen;
        
        use create_type_spec_derive::CreateTypeSpec;
        use read_write_rpc_derive::ReadWriteRPC;
        use std::ops::Add;`;

    export const TokenImports: Array<string> = [
        "use pbc_contract_common::address::Address;",
        "use pbc_contract_common::context::ContractContext;",
        "use pbc_contract_common::events::EventGroup;",
        "use pbc_contract_common::sorted_vec_map::SortedVecMap;"
    ];

    const tokenStateAdditionalQuery = `
        impl TokenState {
            pub fn balance_of(&mut self, owner: Address) -> u128 {
                if !self.balances.contains_key(&owner) {
                    self.balances.insert(owner, 0);
                }
                *self.balances.get(&owner).unwrap()
            }
                    
            pub fn allowance(&mut self, owner: Address, spender: Address) -> u128 {
                if !self.allowed.contains_key(&owner) {
                    self.allowed.insert(owner, SortedVecMap::new());
                }
                let allowed_from_owner = self.allowed.get_mut(&owner).unwrap();
        
                if !allowed_from_owner.contains_key(&spender) {
                    allowed_from_owner.insert(spender, 0);
                }
                let allowance = allowed_from_owner.get(&spender).unwrap();
                *allowance
            }
        
            fn update_allowance(&mut self, owner: Address, spender: Address, amount: u128) {
                if !self.allowed.contains_key(&owner) {
                    self.allowed.insert(owner, SortedVecMap::new());
                }
                let allowed_from_owner = self.allowed.get_mut(&owner).unwrap();
        
                allowed_from_owner.insert(spender, amount);
            }
        }    
    `

    const StateInitialization = `
        #[init]
        pub fn initialize(
            ctx: ContractContext,
            name: String,
            symbol: String,
            decimals: u8,
            total_supply: u128,
        ) -> (TokenState, Vec<EventGroup>) {
            let mut balances = SortedVecMap::new();
            balances.insert(ctx.sender, total_supply);

            let state = TokenState {
                name,
                symbol,
                decimals,
                owner: ctx.sender,
                total_supply,
                balances,
                allowed: SortedVecMap::new(),
            };

            (state, vec![])
        }

        /// Represents the type of a transfer.
        #[derive(ReadWriteRPC, CreateTypeSpec)]
        pub struct Transfer {
            /// The address to transfer to.
            pub to: Address,
            /// The amount to transfer.
            pub amount: u128,
        }
    `

    const transferTokenAction: string = `
    #[action(shortname = 0x01)]
    pub fn transfer(
        context: ContractContext,
        state: TokenState,
        to: Address,
        amount: u128,
    ) -> (TokenState, Vec<EventGroup>) {
        core_transfer(context.sender, state, to, amount)
    }
    `


    const bulkTransferAction: string = `
    #[action(shortname = 0x02)]
    pub fn bulk_transfer(
        context: ContractContext,
        state: TokenState,
        transfers: Vec<Transfer>,
    ) -> (TokenState, Vec<EventGroup>) {
        let mut new_state = state;
        for t in transfers {
            new_state = core_transfer(context.sender, new_state, t.to, t.amount).0;
        }
        (new_state, vec![])
    }
    `

    const transferFromAction: string = ` 
    #[action(shortname = 0x03)]
    pub fn transfer_from(
        context: ContractContext,
        state: TokenState,
        from: Address,
        to: Address,
        amount: u128,
    ) -> (TokenState, Vec<EventGroup>) {
        core_transfer_from(context.sender, state, from, to, amount)
    }    
    `

    const bulkTransferFromAction: string = `
    #[action(shortname = 0x04)]
    pub fn bulk_transfer_from(
        context: ContractContext,
        state: TokenState,
        from: Address,
        transfers: Vec<Transfer>,
    ) -> (TokenState, Vec<EventGroup>) {
        let mut new_state = state;
        for t in transfers {
            new_state = core_transfer_from(context.sender, new_state, from, t.to, t.amount).0;
        }
        (new_state, vec![])
    }    
    `;


    const approveAction: string = `
    #[action(shortname = 0x05)]
    pub fn approve(
        context: ContractContext,
        state: TokenState,
        spender: Address,
        amount: u128,
    ) -> (TokenState, Vec<EventGroup>) {
        let mut new_state = state;
        new_state.update_allowance(context.sender, spender, amount);
        (new_state, vec![])
    }
    `;

    const actionAdditional: string = `
    pub fn core_transfer(
        sender: Address,
        state: TokenState,
        to: Address,
        amount: u128,
    ) -> (TokenState, Vec<EventGroup>) {
        let mut new_state = state;
        let from_amount = new_state.balance_of(sender);
        let o_new_from_amount = from_amount.checked_sub(amount);
        match o_new_from_amount {
            Some(new_from_amount) => {
                new_state.balances.insert(sender, new_from_amount);
            }
            None => {
                panic!("Underflow in transfer - owner did not have enough tokens");
            }
        }
        let to_amount = new_state.balance_of(to);
        new_state.balances.insert(to, to_amount.add(amount));
        if new_state.balance_of(sender) == 0 {
            new_state.balances.remove(&sender);
        };
        (new_state, vec![])
    }
    
    pub fn core_transfer_from(
        sender: Address,
        state: TokenState,
        from: Address,
        to: Address,
        amount: u128,
    ) -> (TokenState, Vec<EventGroup>) {
        let mut new_state = state;
        let from_allowed = new_state.allowance(from, sender);
        let o_new_allowed_amount = from_allowed.checked_sub(amount);
        match o_new_allowed_amount {
            Some(new_allowed_amount) => {
                new_state.update_allowance(from, sender, new_allowed_amount);
            }
            None => {
                panic!("Underflow in transfer_from - tokens has not been approved for transfer");
            }
        }
        core_transfer(from, new_state, to, amount)
    }
    `

    type Action = {
        actionName: string, actionContent: string
    }

    export const tokenActions: Array<Action> = [
        { actionName: 'transferFromAction', actionContent: transferFromAction },
        { actionName: 'bulkTransferAction', actionContent: bulkTransferAction },
        { actionName: 'transferTokenAction', actionContent: transferTokenAction },
        { actionName: 'bulkTransferFromAction', actionContent: bulkTransferFromAction },
        { actionName: 'approveAction', actionContent: approveAction }
    ]

    class ClassicTypeWrap<T> {
        public val: T;
        public valName: string;
        public typeName: string;

        public constructor(val: T, valName: string, typeName: string) {
            this.val = val;
            this.typeName = typeName;
            this.valName = valName;
        }

        public toString(): string {
            return `${this.typeName}`
        }
    }

    class MapWrap<T, V> {
        public val = new Map();
        public valName: string;
        public firstKeyType: string;
        public secondKeyType: string;
        public sorted: Boolean;

        public constructor(valName: string, firstKeyType: string, secondKeyType: string, sorted: Boolean) {
            this.firstKeyType = firstKeyType;
            this.secondKeyType = secondKeyType;
            this.sorted = sorted;
            this.valName = valName;
        }

        public toString(): string {
            let retStr = ""
            if (this.sorted) retStr = "SortedVecMap<"
            else retStr = "Map<"

            retStr += `${this.firstKeyType}, ${this.secondKeyType}>`

            return retStr
        }
    }

    type Address = Array<number>;
    type u128 = Array<number>;
    type SortedVecMap<T, K> = Map<T, K>;
    type u8 = Uint8Array;

    export class Token {
        [index: string]: any;
        public name: ClassicTypeWrap<string> = new ClassicTypeWrap<string>('', 'name', 'string');
        public decimals: ClassicTypeWrap<u8> = new ClassicTypeWrap<u8>(new Uint8Array(0), 'decimals', 'u8');
        public symbol: ClassicTypeWrap<string> = new ClassicTypeWrap('', 'symbol', 'string');
        public address: ClassicTypeWrap<Address> = new ClassicTypeWrap(new Array<number>(256), 'address', 'Address');
        public total_supply: ClassicTypeWrap<u128> = new ClassicTypeWrap(new Array<number>(256), 'total_supply', 'u128');
        private balances: MapWrap<Address, u128> = new MapWrap('balances', 'Address', 'u128', true);
        private allowed: MapWrap<Address, SortedVecMap<Address, u128>> = new MapWrap('allowed', 'Address', 'SortedVecMap<Address, u128>', true);

        private actions: Array<Action> = [];

        public constructor(public imports: Array<string> = TokenImports) {
            this.imports = imports
        }

        public addToImport(import_val: string) {
            this.imports.push(import_val);
        }

        public deleteFromImports(import_val: string) {
            this.imports = this.imports.filter((val) => val !== import_val);
        }

        public getImports(): Array<string> {
            return [...this.imports];
        }

        public tokenState(): [[string, string]] {
            let states: any = [];
            for (let valName in this) {
                const vv = valName as unknown as string;
                if (vv === "imports" || vv === "actions") continue;
                states.push([valName as unknown as string, this[valName] as unknown as string])
            }

            return states
        }

        public addState(stateName: string, stateType: string) {
            this[stateName] = new ClassicTypeWrap<string>('', stateName, stateType);
        }

        public removeState(stateName: string) {
            delete this[stateName];
        }

        public pushAction(index: number) {
            for (let action of this.actions) {
                if ( tokenActions[index].actionName === action.actionName) 
                    return;
            }

            this.actions.push(tokenActions[index]);
        }

        public removeAction(index: number) {
            this.actions = this.actions.filter(
                (action, _) => action.actionName !== tokenActions[index].actionName
            );
        }


        public buildContract(): string {
            let contract: string = "";
            // Headers
            contract += TokenHeaders + "\n\n"; 
            
            for (let importStr of this.imports) 
                contract += importStr + "\n";

            // State
            contract += "\n#[state]\n";
            contract += "pub struct TokenState { \n"
            for (let state of this.tokenState()) {
                const [stateName, stateType] = state;
                contract += `${stateName}: ${stateType},\n`;
            }
            contract += "}\n";

            contract += tokenStateAdditionalQuery;
            contract += StateInitialization; 

            // actions
            for (let action of this.actions)
                contract += action.actionContent + "\n\n"; 

            contract += actionAdditional;
            console.log(contract);
            return contract;
        }

    };

    export function tokenHandler(token: Token) {

    }
}