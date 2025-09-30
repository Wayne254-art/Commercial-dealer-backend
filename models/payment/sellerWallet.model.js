import { DataTypes } from 'sequelize'

const SellerWalletModel = (sequelize) => {
    return sequelize.define('SellerWallet', {
        walletId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        sellerId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        amount: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        month: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    }, {
        tableName: 'seller_wallet',
        timestamps: true
    })
}

export default SellerWalletModel;