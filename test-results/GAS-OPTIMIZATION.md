# Gas Optimization Report

Generated: 2025-12-05T11:09:11.338Z

## Function Gas Costs

| Function | Average Gas | Min Gas | Max Gas |
| --- | --- | --- | --- |
| storePaper | 141,352 | 141,352 | 141,352 |
| storeStudentResponse | 95,798 | 95,798 | 95,798 |
| addStudentScore | 90,708 | 90,708 | 90,708 |
| storeQuizScore | 114,054 | 114,054 | 114,054 |

## Cost Estimates

Assuming ETH = $2000

| Function | 10 Gwei | 50 Gwei | 100 Gwei |
| --- | --- | --- | --- |
| storePaper | $2.8270 | $14.1352 | $28.2704 |
| storeStudentResponse | $1.9160 | $9.5798 | $19.1596 |
| addStudentScore | $1.8142 | $9.0708 | $18.1416 |
| storeQuizScore | $2.2811 | $11.4054 | $22.8108 |

## Optimization Recommendations

1. Consider using shorter CID representations or off-chain storage for metadata
2. Use events instead of storage where possible for historical data
3. Implement pagination for array retrievals to prevent out-of-gas errors
4. Consider using bytes32 for IDs instead of strings to save gas
5. Batch operations when possible to amortize transaction costs
6. Use calldata instead of memory for function parameters when applicable
