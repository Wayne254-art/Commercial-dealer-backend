import { DataTypes } from 'sequelize'

const SellerCustomerModel = (sequelize) => {
    return sequelize.define('SellerCustomer', {
    customId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    myId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    myFriends: {
        type: DataTypes.JSON,
        defaultValue: []
    }
}, {
    timestamps: true,
    tableName: 'seller_customers'
})
}

export default SellerCustomerModel
