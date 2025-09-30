import { DataTypes } from 'sequelize';

const FavoriteModel = (sequelize) => {
    return sequelize.define('Favorite', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        customerId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        listingId: {
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
        },
        price: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        availability: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        image: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        rating: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
        }
    }, {
        timestamps: true,
        tableName: 'favorites'
    });
}

export default FavoriteModel;
