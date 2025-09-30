import { DataTypes } from 'sequelize';

const SubscriptionModel = (sequelize) => {
    return sequelize.define('pkgSubscriptions', {
        subscriptionId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        sellerId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
        },
        sellerEmail: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true,
            },
        },
        pkgTitle: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        price: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        startDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        expiryDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        paymentReference: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    }, {
        tableName: 'subscriptions',
        timestamps: true,
    });
}

export default SubscriptionModel