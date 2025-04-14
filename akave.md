# Akave Storage Integration

## Implementation Overview
Our mobile app leverages Akave for:
1. **Storage of Workout History** -
2. **Storage of Meal Plans** 
3. **Storage of Meal Tracking Nutrion Data**
4. **DAO Content Storage**  

## Key Integration Points
### 1. Upload Data
https://github.com/dominichackett/body-blue-print/blob/2f21179c211ece4f1d5fff07def8b2e507734b10/app/(tabs)/settings.tsx#L20-L56

https://github.com/dominichackett/body-blue-print/blob/2f21179c211ece4f1d5fff07def8b2e507734b10/app/(tabs)/settings.tsx#L186-L248

## Smart Contracts to Manage DAO Deployed on AKAVE Testnet
###  DAO Governance Token
https://github.com/dominichackett/body-blue-print/blob/2f21179c211ece4f1d5fff07def8b2e507734b10/contracts/contracts/DaoToken.sol#L1-L30

###  DAO Governance Contract
https://github.com/dominichackett/body-blue-print/blob/2f21179c211ece4f1d5fff07def8b2e507734b10/contracts/contracts/HealthDAOGovernance.sol#L1-L131

###  DAO Storage Access Control
https://github.com/dominichackett/body-blue-print/blob/2f21179c211ece4f1d5fff07def8b2e507734b10/contracts/contracts/HealthDAOStorage1.sol#L1-L345

## Relay Server to AKAVE Link
https://github.com/dominichackett/akaveserver/blob/main/server.js


## Manage DAO Data Downloads on Front End Via Relay Server and Akave Link
https://github.com/dominichackett/bodyblueprint-dao-frontend/blob/master/src/components/subscription/subscribe.tsx#L95-L157
