# ERP Database Schema Documentation

## Overview
This document describes the comprehensive database schema for the Ethanol & Sugar Factory ERP System. The schema is designed to support multi-company operations with integrated business divisions (Sugar, Power, Ethanol, Animal Feed).

## Database Technology
- **Database**: PostgreSQL 17 (Cloud) / MS SQL Server 2024 (Local)
- **ORM**: Prisma 6.0
- **Architecture**: Multi-tenant with company isolation

## Core Modules

### 1. Core Models
#### User Management
- **User**: System users with roles and permissions
  - Roles: ADMIN, MANAGER, OPERATOR, VIEWER, ACCOUNTANT, STORE_KEEPER, PURCHASE_MANAGER
  - Audit fields: createdAt, updatedAt, lastLogin
  
#### Company & Factory
- **Company**: Legal entities with GST, PAN, TAN details
- **CompanyUser**: Many-to-many relationship with role-based permissions
- **Factory**: Manufacturing units with capacity details
  - Types: SUGAR, ETHANOL, INTEGRATED, FEED, POWER
  - Capacities: Crushing (TPD), Power (MW), Ethanol (KLPD), Feed (TPD)

### 2. Master Data
#### Vendor Management
- **Vendor**: Suppliers with credit terms and MSME support
  - Types: MATERIAL, SERVICE, TRANSPORTER, CONTRACTOR
  - Banking details for payment automation
  
#### Customer Management
- **Customer**: Buyers categorized by division
  - Credit limits and payment terms
  - GST compliance fields

#### Material Master
- **Material**: Items with inventory tracking
  - Categories: RAW_MATERIAL, CONSUMABLE, SPARE_PART, etc.
  - Reorder levels and lead times
  - HSN codes for GST compliance

#### Chart of Accounts
- **Account**: Hierarchical account structure
  - Types: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
  - Bank account integration

### 3. Store Module
#### Procurement Workflow
1. **Requisition**: Material requests with approval workflow
2. **PurchaseOrder**: Vendor orders with terms
3. **GoodsReceipt**: Receipt and quality check
4. **Inventory**: Real-time stock tracking
5. **StockTransfer**: Inter-factory transfers

Key Features:
- Multi-level approval matrix
- Quality control integration
- Batch and expiry tracking
- E-way bill support

### 4. Finance Module
#### Accounts Payable
- **Invoice**: Vendor bills with GST breakup
- **Payment**: Multiple payment modes with TDS
- **Banking**: Bank reconciliation

#### Accounts Receivable
- **Invoice**: Sales bills with GST
- **Receipt**: Customer payments
- **Banking**: Collection tracking

#### General Ledger
- **Journal**: Double-entry bookkeeping
- **JournalEntry**: Debit/Credit entries
- Cost center accounting

### 5. Farmer Management
#### Farmer Operations
- **Farmer**: Registration with Aadhar/bank details
- **CaneDelivery**: Weighbridge integration
  - Quality parameters: Brix, Pol, Purity
  - Recovery-based pricing
  - Transport deductions
- **FarmerPayment**: Periodic settlement

### 6. Production Modules
#### Sugar Division
- **SugarProduction**: Daily production tracking
  - Shift-wise monitoring
  - By-products: Molasses, Bagasse, Press mud
  - Resource consumption

#### Power Division
- **PowerGeneration**: Energy production
  - Fuel consumption (Bagasse/Coal)
  - Grid export tracking
  - Plant efficiency metrics

#### Ethanol Division
- **EthanolProduction**: Batch production
  - Fermentation/Distillation tracking
  - Yield efficiency
  - Slops and CO2 generation

#### Feed Division
- **FeedProduction**: Animal feed manufacturing
  - Formula management
  - Quality parameters

### 7. Common Modules
#### Weighbridge
- **WeighbridgeEntry**: Vehicle weighment
  - Gross/Tare/Net weight
  - Integration with deliveries

#### Equipment & Maintenance
- **Equipment**: Asset register
- **Maintenance**: Preventive/Breakdown tracking
  - Spare parts usage
  - Cost tracking

### 8. Settings & Configuration
- **TaxRate**: GST rates with validity
- **HSNCode**: HSN/SAC codes
- **UOM**: Units of measurement
- **ApprovalMatrix**: Document approval rules

### 9. Analytics & Reporting
- **PlantMetrics**: Real-time KPIs
- **AlertLog**: System alerts
- **DashboardConfig**: User dashboards
- **Document**: AI-powered document management

## Key Features

### Multi-Company Support
- Complete data isolation between companies
- Shared user access with company-specific roles
- Consolidated reporting capability

### Audit Trail
- All tables include createdAt, updatedAt
- User tracking for create/approve actions
- Document activity logging

### Indian Compliance
- GST support with CGST/SGST/IGST
- TDS deduction tracking
- E-way bill integration
- MSME vendor support

### Performance Optimization
- Strategic indexes on foreign keys
- Composite indexes for common queries
- Unique constraints for data integrity

### Integration Points
- Weighbridge serial/TCP communication
- DCS/SCADA integration
- Banking API connectivity
- Government portal integration

## Migration Strategy

### From Existing Systems
1. Master data migration (Vendors, Customers, Materials)
2. Opening balances (Inventory, Accounts)
3. Historical transactions (optional)
4. User access setup

### Data Validation
- Duplicate checks (GST, PAN, Aadhar)
- Referential integrity
- Balance reconciliation

## Security Considerations
- Role-based access control
- Field-level permissions (in CompanyUser)
- Data encryption for sensitive fields
- API authentication tokens

## Scalability
- Designed for 10+ companies
- 100+ concurrent users
- Millions of transactions
- Partition strategy for large tables

## Backup & Recovery
- Daily automated backups
- Point-in-time recovery
- Cross-region replication
- Disaster recovery plan

## Future Enhancements
- Blockchain integration for transparency
- IoT sensor data collection
- Advanced analytics with ML
- Mobile app support
- Multi-currency support
- Multi-language interface