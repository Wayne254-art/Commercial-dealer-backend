import { DataTypes } from 'sequelize'

const ShopWalletModel = (sequelize) => {
    return sequelize.define('ShopWallet', {
        walletId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
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
        tableName: 'shop_wallet',
        timestamps: true
    })
}

export default ShopWalletModel;