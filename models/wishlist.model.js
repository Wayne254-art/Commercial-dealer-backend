import { DataTypes } from 'sequelize';

const WishlistModel = (sequelize) => {
    return sequelize.define('WishlistModel', {
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
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        price: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        rating: {
            type: DataTypes.FLOAT,
            allowNull: true,
            validate: {
                min: 0,
                max: 5
            }
        },
        discount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0,
                max: 100
            }
        },
        image: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        tableName: 'wishlist_products',
        timestamps: true,
    });
}

export default WishlistModel;