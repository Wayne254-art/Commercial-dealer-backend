import { DataTypes } from 'sequelize';

const AccountModel = (sequelize) => {
    return sequelize.define('SellerPayment', {
        accountId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        sellerId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
        },
        businessName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        accountNumber: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        bank: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
    }, {
        tableName: 'seller_accounts',
        timestamps: true
    });
}

export default AccountModel