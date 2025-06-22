-- Initialize ERP Database
USE master;
GO

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'erp_factory')
BEGIN
    CREATE DATABASE erp_factory;
END
GO

USE erp_factory;
GO

-- Create basic tables if they don't exist
-- Note: Prisma will handle the full schema creation

-- Create a basic user for initial access
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'User')
BEGIN
    CREATE TABLE [User] (
        id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        email NVARCHAR(255) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) DEFAULT 'USER',
        divisions NVARCHAR(MAX), -- JSON array
        active BIT DEFAULT 1,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Insert default admin user (password: admin123)
IF NOT EXISTS (SELECT * FROM [User] WHERE email = 'admin@factory.com')
BEGIN
    INSERT INTO [User] (email, password, name, role, divisions)
    VALUES (
        'admin@factory.com',
        '$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', -- Hash of 'admin123'
        'Admin User',
        'ADMIN',
        '["sugar", "power", "ethanol", "feed"]'
    );
END
GO

PRINT 'Database initialization completed successfully';
GO