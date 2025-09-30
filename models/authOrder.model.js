import { DataTypes } from 'sequelize'

const AuthOrderModel = (sequelize) => {
    return sequelize.define('AuthOrder', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        orderId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        sellerId: {
            type: DataTypes.UUID,
            allowNull: false
        },
        products: {
            type: DataTypes.JSON,
            allowNull: false,
        },
        price: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        payment_status: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        shippingInfo: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        delivery_status: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        date: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        tableName: 'auth_orders',
        timestamps: true
    })
}

export default AuthOrderModel;