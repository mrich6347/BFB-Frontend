import { AccountType } from "@/types/DTO/account.dto";
import type { CreateAccountRequest } from "@/types/DTO/account.dto";
import { v4 as uuidv4 } from 'uuid';
import { parseFormattedNumberToDecimal } from "@/utils/numberFormatUtil";

export function useAccounts() {
    const prepareAccountCreation = (request: CreateAccountRequest) => {
        const id = uuidv4();
        const inputBalanceStr = String(request.current_balance).trim();
        
        // parsing the number to our DB format ex: 1,234.56 -> 1234.56
        const decimalBalanceStr = parseFormattedNumberToDecimal(inputBalanceStr);
        
        let numericBalance = parseFloat(decimalBalanceStr);

        // if the account is a loan or credit, we need to turn the balance into a negative number 
        // UNLESS it has a '+' in front of it
        if (request.account_type === AccountType.LOAN || request.account_type === AccountType.CREDIT) {
            if (inputBalanceStr.startsWith('+')) {
                numericBalance = Math.abs(numericBalance);
            } else {
                numericBalance = -Math.abs(numericBalance);
            }
        }

        return {
            ...request,
            id,
            current_balance: numericBalance,
        };
    };

    return {
        prepareAccountCreation
    };
}
