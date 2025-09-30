import { DataTypes } from 'sequelize';

// Define Seller Model
const SellerModel = (sequelize) => {
    return sequelize.define('Seller', {
        sellerId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.STRING,
            defaultValue: 'seller'
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending'
        },
        method: {
            type: DataTypes.STRING,
            allowNull: false
        },
        accountType: {
            type: DataTypes.ENUM('private', 'business'),
            allowNull: false,
            defaultValue: 'private',
        },
        sellerType: {
            type: DataTypes.ENUM('dealer', 'garage', 'both'),
            allowNull: false,
        },
        views: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        image: {
            type: DataTypes.STRING,
            defaultValue: ''
        },
        logo: {
            type: DataTypes.STRING,
            defaultValue: ''
        },
        shopInfo: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: null,
        },
        paymentInfo: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: null,
        },
        payment: {
            type: DataTypes.ENUM('active', 'inactive'),
            allowNull: false,
            defaultValue: 'inactive',
        },
        facebook: {
            type: DataTypes.STRING,
            allowNull: true
        },
        instagram: {
            type: DataTypes.STRING,
            allowNull: true
        },
        twitter: {
            type: DataTypes.STRING,
            allowNull: true
        },
        linkedin: {
            type: DataTypes.STRING,
            allowNull: true
        },
        tiktok: {
            type: DataTypes.STRING,
            allowNull: true
        },
        youtube: {
            type: DataTypes.STRING,
            allowNull: true
        },
        isVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        verificationToken: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        OTP: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
        OTPExpires: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        },
    }, {
        tableName: 'sellers',
        timestamps: true
    });
};

export default SellerModel 
