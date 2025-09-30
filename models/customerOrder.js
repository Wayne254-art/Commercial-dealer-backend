import { DataTypes } from 'sequelize'

const CustomerOrderModel = (sequelize) => {
    return sequelize.define('CustomerOrder', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        customerId: {
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
        vat: {
            type: DataTypes.INTEGER,
        },
        subtotal: {
            type: DataTypes.INTEGER,
        },
        total: {
            type: DataTypes.INTEGER,
        },
        payment_status: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        shippingInfo: {
            type: DataTypes.JSON,
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
        tableName: 'customer_orders',
        timestamps: true
    })
}

export default CustomerOrderModel;