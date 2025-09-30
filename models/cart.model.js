import { DataTypes } from 'sequelize';

const CartModel = (sequelize) => {
    return sequelize.define('CartModel', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        productId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    }, {
        tableName: 'cart_products',
        timestamps: true,
    });
}
export default CartModel;