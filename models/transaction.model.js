import { DataTypes } from 'sequelize';

const TransactionModel = (sequelize) => {
    return sequelize.define('Transaction', {
        transactionId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        sellerId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        amount: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        reference: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        paymentMethod: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "Paystack",
        },
    }, {
        tableName: 'transactions',
        timestamps: true,
    });
}

export default TransactionModel