import { DataTypes } from 'sequelize';

const ProductModel = (sequelize) => {
    return sequelize.define('Products', {
        productId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        sellerId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        shopname: {
            type: DataTypes.STRING,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        sku: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        condition: {
            type: DataTypes.ENUM('new', 'used', 'refurbished'),
            allowNull: false,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        brand: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        compatibleCars: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        color: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        size: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        stock: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
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
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        images: {
            type: DataTypes.TEXT,
            get() {
                const value = this.getDataValue('images');
                return value ? JSON.parse(value) : [];
            },
            set(value) {
                this.setDataValue('images', JSON.stringify(value));
            }
        },
        clicks: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        isFeatured: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        isRecommended: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        isPopular: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        isSponsored: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        sponsoredExpiryDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        tableName: 'products',
        timestamps: true,
    });
}

export default ProductModel;
