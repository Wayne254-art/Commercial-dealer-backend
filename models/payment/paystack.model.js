import { DataTypes } from 'sequelize'

const PaystackModel = (sequelize) => {
    return sequelize.define('Paystack', {
    accountId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    sellerId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
    },
    status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    businessName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    accountNumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    percentageCharge: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    settlementBank: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    currency: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    bank: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    integration: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    domain: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    product: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    managedByIntegration: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    subaccountCode: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    settlementSchedule: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    migrate: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    paystackOriginalId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    paystackRecipientCode: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    tableName: 'sub_accounts',
    timestamps: true
})
}

export default PaystackModel