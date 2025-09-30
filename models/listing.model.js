import { DataTypes } from 'sequelize';

const CarListingModel = (sequelize) => {
    return sequelize.define('CarListing', {
        listingId: {
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
            allowNull: false,
            defaultValue: 'wayne_auto_sales'
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        condition: {
            type: DataTypes.ENUM('new', 'foreignused', 'localused'),
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        make: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        model: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        price: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        drivetype: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        transmission: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        fueltype: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        mileage: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        horsepower: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        torque: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        enginesize: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        cylinders: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        color: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        availability: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        doors: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        vin: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.TEXT,
        },
        videolink: {
            type: DataTypes.STRING,
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
        documents: {
            type: DataTypes.TEXT,
            get() {
                const value = this.getDataValue('documents');
                return value ? JSON.parse(value) : [];
            },
            set(value) {
                this.setDataValue('documents', JSON.stringify(value));
            }
        },
        comfortfeatures: {
            type: DataTypes.TEXT,
            get() {
                const value = this.getDataValue('comfortfeatures');
                return value ? JSON.parse(value) : [];
            },
            set(value) {
                this.setDataValue('comfortfeatures', JSON.stringify(value));
            }
        },
        safetyfeatures: {
            type: DataTypes.TEXT,
            get() {
                const value = this.getDataValue('safetyfeatures');
                return value ? JSON.parse(value) : [];
            },
            set(value) {
                this.setDataValue('safetyfeatures', JSON.stringify(value));
            }
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
        timestamps: true,
        tableName: 'car_listings'
    });
}

export default CarListingModel
