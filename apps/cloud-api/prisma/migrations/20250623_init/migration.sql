-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER', 'ACCOUNTANT', 'STORE_KEEPER', 'PURCHASE_MANAGER');

-- CreateEnum
CREATE TYPE "FactoryType" AS ENUM ('SUGAR', 'ETHANOL', 'INTEGRATED', 'FEED', 'POWER');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('MATERIAL', 'SERVICE', 'TRANSPORTER', 'CONTRACTOR', 'OTHER');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('SUGAR', 'ETHANOL', 'POWER', 'FEED', 'OTHER');

-- CreateEnum
CREATE TYPE "MaterialCategory" AS ENUM ('RAW_MATERIAL', 'CONSUMABLE', 'SPARE_PART', 'PACKING_MATERIAL', 'CHEMICAL', 'FUEL', 'FINISHED_GOODS', 'SEMI_FINISHED', 'OTHER');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('STOCK', 'NON_STOCK', 'SERVICE');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "AccountNature" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "RequisitionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_ORDERED', 'ORDERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "POStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "GRNStatus" AS ENUM ('PENDING', 'PARTIALLY_RECEIVED', 'RECEIVED', 'QUALITY_CHECK_PENDING', 'QUALITY_APPROVED', 'QUALITY_REJECTED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('DRAFT', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('PURCHASE', 'SALES', 'DEBIT_NOTE', 'CREDIT_NOTE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'DEMAND_DRAFT', 'LETTER_OF_CREDIT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'PROCESSED', 'CANCELLED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "BankingType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'CHARGES', 'INTEREST');

-- CreateEnum
CREATE TYPE "JournalType" AS ENUM ('GENERAL', 'PAYMENT', 'RECEIPT', 'CONTRA', 'SALES', 'PURCHASE');

-- CreateEnum
CREATE TYPE "JournalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'POSTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'WEIGHED', 'QUALITY_TESTED', 'APPROVED', 'PAYMENT_DUE', 'PAID');

-- CreateEnum
CREATE TYPE "WeighmentStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVE', 'BREAKDOWN', 'PREDICTIVE', 'CONDITION_BASED');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "gstNumber" TEXT NOT NULL,
    "panNumber" TEXT NOT NULL,
    "tanNumber" TEXT,
    "cinNumber" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "website" TEXT,
    "fyStartMonth" INTEGER NOT NULL DEFAULT 4,
    "currentFY" TEXT NOT NULL,
    "logo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyUser" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "permissions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Factory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FactoryType" NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "gstNumber" TEXT,
    "factoryLicense" TEXT,
    "pollutionLicense" TEXT,
    "crushingCapacity" DOUBLE PRECISION,
    "powerCapacity" DOUBLE PRECISION,
    "ethanolCapacity" DOUBLE PRECISION,
    "feedCapacity" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Factory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "type" "VendorType" NOT NULL,
    "gstNumber" TEXT,
    "panNumber" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "contactPerson" TEXT,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "bankIFSC" TEXT,
    "creditDays" INTEGER NOT NULL DEFAULT 30,
    "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isMSME" BOOLEAN NOT NULL DEFAULT false,
    "msmeNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "type" "CustomerType" NOT NULL,
    "gstNumber" TEXT,
    "panNumber" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "contactPerson" TEXT,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "bankIFSC" TEXT,
    "creditDays" INTEGER NOT NULL DEFAULT 30,
    "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "MaterialCategory" NOT NULL,
    "type" "MaterialType" NOT NULL,
    "uomId" TEXT NOT NULL,
    "hsnCodeId" TEXT,
    "reorderLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reorderQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minStockLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxStockLevel" DOUBLE PRECISION,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "specifications" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "nature" "AccountNature" NOT NULL,
    "parentId" TEXT,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBankAccount" BOOLEAN NOT NULL DEFAULT false,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "bankIFSC" TEXT,
    "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "openingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requisition" (
    "id" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "requisitionNo" TEXT NOT NULL,
    "requisitionDate" TIMESTAMP(3) NOT NULL,
    "department" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "purpose" TEXT,
    "status" "RequisitionStatus" NOT NULL DEFAULT 'DRAFT',
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequisitionItem" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "requiredDate" TIMESTAMP(3) NOT NULL,
    "specification" TEXT,
    "remarks" TEXT,

    CONSTRAINT "RequisitionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "poDate" TIMESTAMP(3) NOT NULL,
    "vendorId" TEXT NOT NULL,
    "requisitionId" TEXT,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "paymentTerms" TEXT NOT NULL,
    "deliveryTerms" TEXT,
    "status" "POStatus" NOT NULL DEFAULT 'DRAFT',
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "receivedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "specification" TEXT,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceipt" (
    "id" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "grnNumber" TEXT NOT NULL,
    "grnDate" TIMESTAMP(3) NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "vehicleNumber" TEXT,
    "ewayBillNumber" TEXT,
    "status" "GRNStatus" NOT NULL DEFAULT 'PENDING',
    "qualityChecked" BOOLEAN NOT NULL DEFAULT false,
    "qualityRemarks" TEXT,
    "createdBy" TEXT NOT NULL,
    "receivedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceiptItem" (
    "id" TEXT NOT NULL,
    "goodsReceiptId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "orderedQty" DOUBLE PRECISION NOT NULL,
    "receivedQty" DOUBLE PRECISION NOT NULL,
    "acceptedQty" DOUBLE PRECISION NOT NULL,
    "rejectedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rejectionReason" TEXT,
    "batchNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "GoodsReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "batchNumber" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "location" TEXT,
    "expiryDate" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransfer" (
    "id" TEXT NOT NULL,
    "transferNumber" TEXT NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL,
    "fromFactoryId" TEXT NOT NULL,
    "toFactoryId" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'DRAFT',
    "vehicleNumber" TEXT,
    "driverName" TEXT,
    "remarks" TEXT,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedDate" TIMESTAMP(3),
    "receivedBy" TEXT,
    "receivedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransferItem" (
    "id" TEXT NOT NULL,
    "stockTransferId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "batchNumber" TEXT,
    "remarks" TEXT,

    CONSTRAINT "StockTransferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "type" "InvoiceType" NOT NULL,
    "vendorId" TEXT,
    "customerId" TEXT,
    "poNumber" TEXT,
    "grnNumber" TEXT,
    "taxableAmount" DOUBLE PRECISION NOT NULL,
    "cgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "igstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tdsAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "vendorId" TEXT NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL,
    "bankAccountId" TEXT,
    "chequeNumber" TEXT,
    "chequeDate" TIMESTAMP(3),
    "utrNumber" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "tdsAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "PaymentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "receiptDate" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "receiptMode" "PaymentMode" NOT NULL,
    "bankAccountId" TEXT,
    "chequeNumber" TEXT,
    "chequeDate" TIMESTAMP(3),
    "utrNumber" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banking" (
    "id" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "accountId" TEXT NOT NULL,
    "transactionType" "BankingType" NOT NULL,
    "referenceNumber" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "narration" TEXT,
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciledDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journal" (
    "id" TEXT NOT NULL,
    "journalNumber" TEXT NOT NULL,
    "journalDate" TIMESTAMP(3) NOT NULL,
    "type" "JournalType" NOT NULL,
    "narration" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "JournalStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Journal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" "EntryType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "costCenter" TEXT,
    "narration" TEXT,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farmer" (
    "id" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "farmerCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fatherName" TEXT,
    "village" TEXT NOT NULL,
    "tehsil" TEXT,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT,
    "phone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "aadharNumber" TEXT,
    "panNumber" TEXT,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "bankIFSC" TEXT,
    "totalArea" DOUBLE PRECISION NOT NULL,
    "cultivableArea" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farmer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaneDelivery" (
    "id" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "tokenNumber" TEXT NOT NULL,
    "tokenDate" TIMESTAMP(3) NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "grossWeight" DOUBLE PRECISION NOT NULL,
    "tareWeight" DOUBLE PRECISION NOT NULL,
    "netWeight" DOUBLE PRECISION NOT NULL,
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payableWeight" DOUBLE PRECISION NOT NULL,
    "variety" TEXT,
    "harvestDate" TIMESTAMP(3),
    "brix" DOUBLE PRECISION,
    "pol" DOUBLE PRECISION,
    "purity" DOUBLE PRECISION,
    "recovery" DOUBLE PRECISION,
    "rate" DOUBLE PRECISION NOT NULL,
    "basicAmount" DOUBLE PRECISION NOT NULL,
    "qualityIncentive" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transportCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "weighbridgeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaneDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmerPayment" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "caneAmount" DOUBLE PRECISION NOT NULL,
    "advanceAdjusted" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL,
    "bankReference" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'DRAFT',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmerPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SugarProduction" (
    "id" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "productionDate" TIMESTAMP(3) NOT NULL,
    "shiftNumber" INTEGER NOT NULL,
    "caneCrushed" DOUBLE PRECISION NOT NULL,
    "sugarProduced" DOUBLE PRECISION NOT NULL,
    "recovery" DOUBLE PRECISION NOT NULL,
    "molassesProduced" DOUBLE PRECISION NOT NULL,
    "bagasseProduced" DOUBLE PRECISION NOT NULL,
    "mudProduced" DOUBLE PRECISION NOT NULL,
    "steamConsumed" DOUBLE PRECISION NOT NULL,
    "powerConsumed" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SugarProduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PowerGeneration" (
    "id" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "generationDate" TIMESTAMP(3) NOT NULL,
    "shiftNumber" INTEGER NOT NULL,
    "bagasseConsumed" DOUBLE PRECISION NOT NULL,
    "coalConsumed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "steamGenerated" DOUBLE PRECISION NOT NULL,
    "powerGenerated" DOUBLE PRECISION NOT NULL,
    "powerExported" DOUBLE PRECISION NOT NULL,
    "auxConsumption" DOUBLE PRECISION NOT NULL,
    "frequency" DOUBLE PRECISION,
    "plantLoadFactor" DOUBLE PRECISION,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PowerGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EthanolProduction" (
    "id" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "productionDate" TIMESTAMP(3) NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "molassesUsed" DOUBLE PRECISION NOT NULL,
    "ethanolProduced" DOUBLE PRECISION NOT NULL,
    "ethanolStrength" DOUBLE PRECISION NOT NULL,
    "slopsGenerated" DOUBLE PRECISION NOT NULL,
    "co2Generated" DOUBLE PRECISION,
    "yieldEfficiency" DOUBLE PRECISION NOT NULL,
    "fermentationHours" DOUBLE PRECISION NOT NULL,
    "distillationHours" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EthanolProduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedProduction" (
    "id" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "productionDate" TIMESTAMP(3) NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "bagasseUsed" DOUBLE PRECISION NOT NULL,
    "molassesUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "additivesUsed" TEXT,
    "feedProduced" DOUBLE PRECISION NOT NULL,
    "moistureContent" DOUBLE PRECISION NOT NULL,
    "proteinContent" DOUBLE PRECISION,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedProduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeighbridgeEntry" (
    "id" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "weighmentDate" TIMESTAMP(3) NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "party" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "grossWeight" DOUBLE PRECISION,
    "grossTime" TIMESTAMP(3),
    "tareWeight" DOUBLE PRECISION,
    "tareTime" TIMESTAMP(3),
    "netWeight" DOUBLE PRECISION,
    "challanNumber" TEXT,
    "remarks" TEXT,
    "status" "WeighmentStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeighbridgeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "equipmentCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "warrantyExpiry" TIMESTAMP(3),
    "specifications" TEXT,
    "criticalSpares" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maintenance" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "maintenanceType" "MaintenanceType" NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "actualDate" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "sparesUsed" TEXT,
    "labourHours" DOUBLE PRECISION,
    "cost" DOUBLE PRECISION,
    "performedBy" TEXT,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "nextDueDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxRate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cgstRate" DOUBLE PRECISION NOT NULL,
    "sgstRate" DOUBLE PRECISION NOT NULL,
    "igstRate" DOUBLE PRECISION NOT NULL,
    "cessRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HSNCode" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "gstRate" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HSNCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UOM" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "conversionFactor" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "baseUOM" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UOM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalMatrix" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "documentType" TEXT,
    "minAmount" DOUBLE PRECISION NOT NULL,
    "maxAmount" DOUBLE PRECISION NOT NULL,
    "approverRole" TEXT NOT NULL,
    "approvalLevel" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalMatrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantMetrics" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "division" TEXT NOT NULL,
    "production" DOUBLE PRECISION NOT NULL,
    "efficiency" DOUBLE PRECISION NOT NULL,
    "utilization" DOUBLE PRECISION NOT NULL,
    "quality" DOUBLE PRECISION,
    "alerts" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlantMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertLog" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "AlertLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "supplier" TEXT,
    "customer" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileSize" TEXT,
    "pages" INTEGER,
    "extractedData" TEXT,
    "metadata" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentActivity" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_InvoiceToPayment" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InvoiceToPayment_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_InvoiceToReceipt" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InvoiceToReceipt_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Company_code_key" ON "Company"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Company_gstNumber_key" ON "Company"("gstNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Company_panNumber_key" ON "Company"("panNumber");

-- CreateIndex
CREATE INDEX "CompanyUser_userId_idx" ON "CompanyUser"("userId");

-- CreateIndex
CREATE INDEX "CompanyUser_companyId_idx" ON "CompanyUser"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyUser_companyId_userId_key" ON "CompanyUser"("companyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Factory_code_key" ON "Factory"("code");

-- CreateIndex
CREATE INDEX "Factory_companyId_idx" ON "Factory"("companyId");

-- CreateIndex
CREATE INDEX "Vendor_companyId_idx" ON "Vendor"("companyId");

-- CreateIndex
CREATE INDEX "Vendor_type_idx" ON "Vendor"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_companyId_code_key" ON "Vendor"("companyId", "code");

-- CreateIndex
CREATE INDEX "Customer_companyId_idx" ON "Customer"("companyId");

-- CreateIndex
CREATE INDEX "Customer_type_idx" ON "Customer"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_companyId_code_key" ON "Customer"("companyId", "code");

-- CreateIndex
CREATE INDEX "Material_companyId_idx" ON "Material"("companyId");

-- CreateIndex
CREATE INDEX "Material_category_idx" ON "Material"("category");

-- CreateIndex
CREATE INDEX "Material_type_idx" ON "Material"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Material_companyId_code_key" ON "Material"("companyId", "code");

-- CreateIndex
CREATE INDEX "Account_companyId_idx" ON "Account"("companyId");

-- CreateIndex
CREATE INDEX "Account_type_idx" ON "Account"("type");

-- CreateIndex
CREATE INDEX "Account_parentId_idx" ON "Account"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_companyId_code_key" ON "Account"("companyId", "code");

-- CreateIndex
CREATE INDEX "Requisition_factoryId_idx" ON "Requisition"("factoryId");

-- CreateIndex
CREATE INDEX "Requisition_status_idx" ON "Requisition"("status");

-- CreateIndex
CREATE INDEX "Requisition_requisitionDate_idx" ON "Requisition"("requisitionDate");

-- CreateIndex
CREATE UNIQUE INDEX "Requisition_factoryId_requisitionNo_key" ON "Requisition"("factoryId", "requisitionNo");

-- CreateIndex
CREATE INDEX "RequisitionItem_requisitionId_idx" ON "RequisitionItem"("requisitionId");

-- CreateIndex
CREATE INDEX "RequisitionItem_materialId_idx" ON "RequisitionItem"("materialId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_factoryId_idx" ON "PurchaseOrder"("factoryId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_vendorId_idx" ON "PurchaseOrder"("vendorId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_poDate_idx" ON "PurchaseOrder"("poDate");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_factoryId_poNumber_key" ON "PurchaseOrder"("factoryId", "poNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_materialId_idx" ON "PurchaseOrderItem"("materialId");

-- CreateIndex
CREATE INDEX "GoodsReceipt_factoryId_idx" ON "GoodsReceipt"("factoryId");

-- CreateIndex
CREATE INDEX "GoodsReceipt_purchaseOrderId_idx" ON "GoodsReceipt"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "GoodsReceipt_grnDate_idx" ON "GoodsReceipt"("grnDate");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceipt_factoryId_grnNumber_key" ON "GoodsReceipt"("factoryId", "grnNumber");

-- CreateIndex
CREATE INDEX "GoodsReceiptItem_goodsReceiptId_idx" ON "GoodsReceiptItem"("goodsReceiptId");

-- CreateIndex
CREATE INDEX "GoodsReceiptItem_materialId_idx" ON "GoodsReceiptItem"("materialId");

-- CreateIndex
CREATE INDEX "Inventory_factoryId_idx" ON "Inventory"("factoryId");

-- CreateIndex
CREATE INDEX "Inventory_materialId_idx" ON "Inventory"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_factoryId_materialId_batchNumber_key" ON "Inventory"("factoryId", "materialId", "batchNumber");

-- CreateIndex
CREATE INDEX "StockTransfer_fromFactoryId_idx" ON "StockTransfer"("fromFactoryId");

-- CreateIndex
CREATE INDEX "StockTransfer_toFactoryId_idx" ON "StockTransfer"("toFactoryId");

-- CreateIndex
CREATE INDEX "StockTransfer_transferDate_idx" ON "StockTransfer"("transferDate");

-- CreateIndex
CREATE UNIQUE INDEX "StockTransfer_transferNumber_key" ON "StockTransfer"("transferNumber");

-- CreateIndex
CREATE INDEX "StockTransferItem_stockTransferId_idx" ON "StockTransferItem"("stockTransferId");

-- CreateIndex
CREATE INDEX "StockTransferItem_materialId_idx" ON "StockTransferItem"("materialId");

-- CreateIndex
CREATE INDEX "Invoice_vendorId_idx" ON "Invoice"("vendorId");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_invoiceDate_idx" ON "Invoice"("invoiceDate");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Payment_vendorId_idx" ON "Payment"("vendorId");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_idx" ON "Payment"("paymentDate");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentNumber_key" ON "Payment"("paymentNumber");

-- CreateIndex
CREATE INDEX "Receipt_customerId_idx" ON "Receipt"("customerId");

-- CreateIndex
CREATE INDEX "Receipt_receiptDate_idx" ON "Receipt"("receiptDate");

-- CreateIndex
CREATE INDEX "Receipt_status_idx" ON "Receipt"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber");

-- CreateIndex
CREATE INDEX "Banking_accountId_idx" ON "Banking"("accountId");

-- CreateIndex
CREATE INDEX "Banking_transactionDate_idx" ON "Banking"("transactionDate");

-- CreateIndex
CREATE INDEX "Banking_reconciled_idx" ON "Banking"("reconciled");

-- CreateIndex
CREATE INDEX "Journal_journalDate_idx" ON "Journal"("journalDate");

-- CreateIndex
CREATE INDEX "Journal_status_idx" ON "Journal"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Journal_journalNumber_key" ON "Journal"("journalNumber");

-- CreateIndex
CREATE INDEX "JournalEntry_journalId_idx" ON "JournalEntry"("journalId");

-- CreateIndex
CREATE INDEX "JournalEntry_accountId_idx" ON "JournalEntry"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Farmer_aadharNumber_key" ON "Farmer"("aadharNumber");

-- CreateIndex
CREATE INDEX "Farmer_factoryId_idx" ON "Farmer"("factoryId");

-- CreateIndex
CREATE INDEX "Farmer_village_idx" ON "Farmer"("village");

-- CreateIndex
CREATE INDEX "Farmer_aadharNumber_idx" ON "Farmer"("aadharNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Farmer_factoryId_farmerCode_key" ON "Farmer"("factoryId", "farmerCode");

-- CreateIndex
CREATE INDEX "CaneDelivery_factoryId_idx" ON "CaneDelivery"("factoryId");

-- CreateIndex
CREATE INDEX "CaneDelivery_farmerId_idx" ON "CaneDelivery"("farmerId");

-- CreateIndex
CREATE INDEX "CaneDelivery_tokenDate_idx" ON "CaneDelivery"("tokenDate");

-- CreateIndex
CREATE INDEX "CaneDelivery_status_idx" ON "CaneDelivery"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CaneDelivery_factoryId_tokenNumber_key" ON "CaneDelivery"("factoryId", "tokenNumber");

-- CreateIndex
CREATE INDEX "FarmerPayment_farmerId_idx" ON "FarmerPayment"("farmerId");

-- CreateIndex
CREATE INDEX "FarmerPayment_paymentDate_idx" ON "FarmerPayment"("paymentDate");

-- CreateIndex
CREATE INDEX "FarmerPayment_status_idx" ON "FarmerPayment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FarmerPayment_paymentNumber_key" ON "FarmerPayment"("paymentNumber");

-- CreateIndex
CREATE INDEX "SugarProduction_factoryId_idx" ON "SugarProduction"("factoryId");

-- CreateIndex
CREATE INDEX "SugarProduction_productionDate_idx" ON "SugarProduction"("productionDate");

-- CreateIndex
CREATE UNIQUE INDEX "SugarProduction_factoryId_productionDate_shiftNumber_key" ON "SugarProduction"("factoryId", "productionDate", "shiftNumber");

-- CreateIndex
CREATE INDEX "PowerGeneration_factoryId_idx" ON "PowerGeneration"("factoryId");

-- CreateIndex
CREATE INDEX "PowerGeneration_generationDate_idx" ON "PowerGeneration"("generationDate");

-- CreateIndex
CREATE UNIQUE INDEX "PowerGeneration_factoryId_generationDate_shiftNumber_key" ON "PowerGeneration"("factoryId", "generationDate", "shiftNumber");

-- CreateIndex
CREATE INDEX "EthanolProduction_factoryId_idx" ON "EthanolProduction"("factoryId");

-- CreateIndex
CREATE INDEX "EthanolProduction_productionDate_idx" ON "EthanolProduction"("productionDate");

-- CreateIndex
CREATE UNIQUE INDEX "EthanolProduction_factoryId_batchNumber_key" ON "EthanolProduction"("factoryId", "batchNumber");

-- CreateIndex
CREATE INDEX "FeedProduction_factoryId_idx" ON "FeedProduction"("factoryId");

-- CreateIndex
CREATE INDEX "FeedProduction_productionDate_idx" ON "FeedProduction"("productionDate");

-- CreateIndex
CREATE UNIQUE INDEX "FeedProduction_factoryId_batchNumber_key" ON "FeedProduction"("factoryId", "batchNumber");

-- CreateIndex
CREATE INDEX "WeighbridgeEntry_factoryId_idx" ON "WeighbridgeEntry"("factoryId");

-- CreateIndex
CREATE INDEX "WeighbridgeEntry_vehicleNumber_idx" ON "WeighbridgeEntry"("vehicleNumber");

-- CreateIndex
CREATE INDEX "WeighbridgeEntry_weighmentDate_idx" ON "WeighbridgeEntry"("weighmentDate");

-- CreateIndex
CREATE INDEX "WeighbridgeEntry_status_idx" ON "WeighbridgeEntry"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WeighbridgeEntry_factoryId_ticketNumber_key" ON "WeighbridgeEntry"("factoryId", "ticketNumber");

-- CreateIndex
CREATE INDEX "Equipment_factoryId_idx" ON "Equipment"("factoryId");

-- CreateIndex
CREATE INDEX "Equipment_category_idx" ON "Equipment"("category");

-- CreateIndex
CREATE INDEX "Equipment_department_idx" ON "Equipment"("department");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_factoryId_equipmentCode_key" ON "Equipment"("factoryId", "equipmentCode");

-- CreateIndex
CREATE INDEX "Maintenance_equipmentId_idx" ON "Maintenance"("equipmentId");

-- CreateIndex
CREATE INDEX "Maintenance_maintenanceType_idx" ON "Maintenance"("maintenanceType");

-- CreateIndex
CREATE INDEX "Maintenance_scheduledDate_idx" ON "Maintenance"("scheduledDate");

-- CreateIndex
CREATE INDEX "Maintenance_status_idx" ON "Maintenance"("status");

-- CreateIndex
CREATE INDEX "TaxRate_companyId_idx" ON "TaxRate"("companyId");

-- CreateIndex
CREATE INDEX "TaxRate_effectiveFrom_idx" ON "TaxRate"("effectiveFrom");

-- CreateIndex
CREATE INDEX "HSNCode_companyId_idx" ON "HSNCode"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "HSNCode_companyId_code_key" ON "HSNCode"("companyId", "code");

-- CreateIndex
CREATE INDEX "UOM_companyId_idx" ON "UOM"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "UOM_companyId_code_key" ON "UOM"("companyId", "code");

-- CreateIndex
CREATE INDEX "ApprovalMatrix_companyId_idx" ON "ApprovalMatrix"("companyId");

-- CreateIndex
CREATE INDEX "ApprovalMatrix_module_idx" ON "ApprovalMatrix"("module");

-- CreateIndex
CREATE INDEX "PlantMetrics_plantId_idx" ON "PlantMetrics"("plantId");

-- CreateIndex
CREATE INDEX "PlantMetrics_division_idx" ON "PlantMetrics"("division");

-- CreateIndex
CREATE INDEX "PlantMetrics_timestamp_idx" ON "PlantMetrics"("timestamp");

-- CreateIndex
CREATE INDEX "AlertLog_plantId_idx" ON "AlertLog"("plantId");

-- CreateIndex
CREATE INDEX "AlertLog_division_idx" ON "AlertLog"("division");

-- CreateIndex
CREATE INDEX "AlertLog_type_idx" ON "AlertLog"("type");

-- CreateIndex
CREATE INDEX "AlertLog_createdAt_idx" ON "AlertLog"("createdAt");

-- CreateIndex
CREATE INDEX "DashboardConfig_userId_idx" ON "DashboardConfig"("userId");

-- CreateIndex
CREATE INDEX "Document_type_status_idx" ON "Document"("type", "status");

-- CreateIndex
CREATE INDEX "Document_date_idx" ON "Document"("date");

-- CreateIndex
CREATE INDEX "Document_supplier_idx" ON "Document"("supplier");

-- CreateIndex
CREATE INDEX "Document_customer_idx" ON "Document"("customer");

-- CreateIndex
CREATE INDEX "DocumentActivity_documentId_idx" ON "DocumentActivity"("documentId");

-- CreateIndex
CREATE INDEX "_InvoiceToPayment_B_index" ON "_InvoiceToPayment"("B");

-- CreateIndex
CREATE INDEX "_InvoiceToReceipt_B_index" ON "_InvoiceToReceipt"("B");

-- AddForeignKey
ALTER TABLE "CompanyUser" ADD CONSTRAINT "CompanyUser_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyUser" ADD CONSTRAINT "CompanyUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factory" ADD CONSTRAINT "Factory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_uomId_fkey" FOREIGN KEY ("uomId") REFERENCES "UOM"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_hsnCodeId_fkey" FOREIGN KEY ("hsnCodeId") REFERENCES "HSNCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requisition" ADD CONSTRAINT "Requisition_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requisition" ADD CONSTRAINT "Requisition_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requisition" ADD CONSTRAINT "Requisition_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisitionItem" ADD CONSTRAINT "RequisitionItem_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "Requisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisitionItem" ADD CONSTRAINT "RequisitionItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "Requisition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "GoodsReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_fromFactoryId_fkey" FOREIGN KEY ("fromFactoryId") REFERENCES "Factory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferItem" ADD CONSTRAINT "StockTransferItem_stockTransferId_fkey" FOREIGN KEY ("stockTransferId") REFERENCES "StockTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferItem" ADD CONSTRAINT "StockTransferItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Banking" ADD CONSTRAINT "Banking_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farmer" ADD CONSTRAINT "Farmer_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaneDelivery" ADD CONSTRAINT "CaneDelivery_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaneDelivery" ADD CONSTRAINT "CaneDelivery_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaneDelivery" ADD CONSTRAINT "CaneDelivery_weighbridgeId_fkey" FOREIGN KEY ("weighbridgeId") REFERENCES "WeighbridgeEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmerPayment" ADD CONSTRAINT "FarmerPayment_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SugarProduction" ADD CONSTRAINT "SugarProduction_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PowerGeneration" ADD CONSTRAINT "PowerGeneration_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EthanolProduction" ADD CONSTRAINT "EthanolProduction_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedProduction" ADD CONSTRAINT "FeedProduction_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeighbridgeEntry" ADD CONSTRAINT "WeighbridgeEntry_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxRate" ADD CONSTRAINT "TaxRate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HSNCode" ADD CONSTRAINT "HSNCode_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UOM" ADD CONSTRAINT "UOM_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalMatrix" ADD CONSTRAINT "ApprovalMatrix_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentActivity" ADD CONSTRAINT "DocumentActivity_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InvoiceToPayment" ADD CONSTRAINT "_InvoiceToPayment_A_fkey" FOREIGN KEY ("A") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InvoiceToPayment" ADD CONSTRAINT "_InvoiceToPayment_B_fkey" FOREIGN KEY ("B") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InvoiceToReceipt" ADD CONSTRAINT "_InvoiceToReceipt_A_fkey" FOREIGN KEY ("A") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InvoiceToReceipt" ADD CONSTRAINT "_InvoiceToReceipt_B_fkey" FOREIGN KEY ("B") REFERENCES "Receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

